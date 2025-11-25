import { NextRequest, NextResponse } from 'next/server';
import { requireAnyRole } from '@/utils/auth';
import { prisma } from '@/lib/prisma';

/**
 * AI Self-Learning Engine
 * Phân tích feedback và tự động cải thiện knowledge base
 */

interface LearningStats {
  totalFeedback: number;
  likeRate: number;
  dislikeRate: number;
  topLikedQuestions: Array<{ question: string; count: number; keywords: string[] }>;
  topDislikedQuestions: Array<{ question: string; count: number; reason?: string }>;
  suggestedKeywords: string[];
  suggestedImprovements: Array<{ docId: string; action: string; reason: string }>;
}

/**
 * POST /api/chatbot-learn
 * Trigger learning process to analyze feedback and improve AI
 */
export async function POST(req: NextRequest) {
  try {
    await requireAnyRole(['admin', 'technician']);

    const { minFeedbackCount = 5, learnFromDays = 30 } = await req.json().catch(() => ({}));

    // 1. Fetch all feedback from last N days
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - learnFromDays);

    const allFeedback = await prisma.chatbotFeedback.findMany({
      where: {
        createdAt: {
          gte: dateFrom,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (allFeedback.length === 0) {
      return NextResponse.json({
        message: 'Chưa có feedback để học. Cần ít nhất 5 feedback.',
        learned: false,
      });
    }

    // 2. Analyze patterns
    const questionStats = new Map<string, { likes: number; dislikes: number; sources: string[] }>();
    
    for (const fb of allFeedback) {
      const qNormalized = fb.question.toLowerCase().trim();
      const existing = questionStats.get(qNormalized) || { likes: 0, dislikes: 0, sources: [] };
      
      if (fb.feedback === 'like') {
        existing.likes++;
      } else {
        existing.dislikes++;
      }
      
      // Track which documents were used in answers
      if (fb.sources) {
        try {
          const sources = JSON.parse(fb.sources);
          if (Array.isArray(sources)) {
            existing.sources.push(...sources);
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
      
      questionStats.set(qNormalized, existing);
    }

    // 3. Find top liked questions (good patterns)
    const topLiked = Array.from(questionStats.entries())
      .filter(([_, stats]) => stats.likes >= minFeedbackCount)
      .sort((a, b) => b[1].likes - a[1].likes)
      .slice(0, 10);

    // 4. Find top disliked questions (need improvement)
    const topDisliked = Array.from(questionStats.entries())
      .filter(([_, stats]) => stats.dislikes >= minFeedbackCount)
      .sort((a, b) => b[1].dislikes - a[1].dislikes)
      .slice(0, 10);

    // 5. Extract keywords from liked questions
    const suggestedKeywords = extractKeywordsFromQuestions(topLiked.map(([q]) => q));

    // 6. Generate improvement suggestions
    const suggestedImprovements: Array<{ docId: string; action: string; reason: string }> = [];

    // Find documents frequently used in disliked answers
    const dislikedDocs = new Map<string, number>();
    for (const [_, stats] of topDisliked) {
      for (const source of stats.sources) {
        dislikedDocs.set(source, (dislikedDocs.get(source) || 0) + 1);
      }
    }

    for (const [docId, count] of dislikedDocs.entries()) {
      if (count >= 3) {
        suggestedImprovements.push({
          docId,
          action: 'review_content',
          reason: `Document này xuất hiện trong ${count} câu trả lời bị dislike. Cần review lại nội dung.`,
        });
      }
    }

    // 7. Calculate statistics
    const totalLikes = allFeedback.filter((f) => f.feedback === 'like').length;
    const totalDislikes = allFeedback.filter((f) => f.feedback === 'dislike').length;
    const total = allFeedback.length;

    const stats: LearningStats = {
      totalFeedback: total,
      likeRate: (totalLikes / total) * 100,
      dislikeRate: (totalDislikes / total) * 100,
      topLikedQuestions: topLiked.map(([q, s]) => ({
        question: q,
        count: s.likes,
        keywords: extractKeywordsFromText(q),
      })),
      topDislikedQuestions: topDisliked.map(([q, s]) => ({
        question: q,
        count: s.dislikes,
        reason: 'Câu trả lời chưa chính xác hoặc thiếu thông tin',
      })),
      suggestedKeywords,
      suggestedImprovements,
    };

    return NextResponse.json({
      success: true,
      message: `Đã phân tích ${total} feedback từ ${learnFromDays} ngày qua.`,
      stats,
      learned: true,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Learning failed', detail: String(e?.message || e) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/chatbot-learn
 * Get learning statistics and recommendations
 */
export async function GET(req: NextRequest) {
  try {
    await requireAnyRole(['admin', 'technician']);

    // Get feedback statistics
    const totalFeedback = await prisma.chatbotFeedback.count();
    const likes = await prisma.chatbotFeedback.count({
      where: { feedback: 'like' },
    });
    const dislikes = await prisma.chatbotFeedback.count({
      where: { feedback: 'dislike' },
    });

    // Get recent learning insights
    const recentLiked = await prisma.chatbotFeedback.findMany({
      where: { feedback: 'like' },
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        question: true,
        answer: true,
        sources: true,
        createdAt: true,
      },
    });

    const recentDisliked = await prisma.chatbotFeedback.findMany({
      where: { feedback: 'dislike' },
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        question: true,
        answer: true,
        sources: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      totalFeedback,
      likes,
      dislikes,
      likeRate: totalFeedback > 0 ? (likes / totalFeedback) * 100 : 0,
      recentLiked,
      recentDisliked,
      recommendations: [
        'Thêm keywords từ câu hỏi được like nhiều',
        'Review lại documents xuất hiện trong câu trả lời bị dislike',
        'Cải thiện nội dung cho các câu hỏi phổ biến',
      ],
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Failed to get learning stats', detail: String(e?.message || e) },
      { status: 500 }
    );
  }
}

// Helper: Extract keywords from text
function extractKeywordsFromText(text: string): string[] {
  const stopWords = new Set([
    'là', 'của', 'và', 'có', 'được', 'trong', 'để', 'cho', 'các', 'một', 'không',
    'thì', 'với', 'này', 'khi', 'như', 'từ', 'hay', 'hoặc', 'đó', 'ở', 'về',
    'làm', 'thế', 'nào', 'cách', 'sao', 'gì', 'ai', 'đâu', 'nơi',
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^\w\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));

  // Count frequency
  const freq = new Map<string, number>();
  for (const w of words) {
    freq.set(w, (freq.get(w) || 0) + 1);
  }

  // Return top keywords
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([w]) => w);
}

// Helper: Extract keywords from multiple questions
function extractKeywordsFromQuestions(questions: string[]): string[] {
  const allWords = new Map<string, number>();
  
  for (const q of questions) {
    const keywords = extractKeywordsFromText(q);
    for (const kw of keywords) {
      allWords.set(kw, (allWords.get(kw) || 0) + 1);
    }
  }

  // Return keywords that appear in multiple questions
  return Array.from(allWords.entries())
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([w]) => w);
}
