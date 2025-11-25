import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface LearningLogEntry {
  timestamp: string;
  totalFeedback: number;
  likeCount: number;
  dislikeCount: number;
  documentsUpdated: number;
  topQuestions: Array<{
    question: string;
    count: number;
    avgScore: number;
  }>;
  improvements: string[];
}

/**
 * Daily AI Learning Cron Job
 * Chạy tự động mỗi ngày vào 00:00 (24h)
 * 
 * Chức năng:
 * 1. Phân tích feedback trong 24h qua
 * 2. Tính toán điểm số cho documents
 * 3. Đồng bộ scores lên Python backend
 * 4. Lưu log học tập
 * 
 * Gọi bởi: Vercel Cron hoặc external cron service
 * URL: /api/cron/daily-ai-learning
 */
export async function POST(request: NextRequest) {
  try {
    // Xác thực cron secret để bảo mật
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'default-secret-change-me';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🤖 [Daily AI Learning] Starting daily learning process...');

    // 1. Lấy feedback trong 24h qua
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const feedbackData = await prisma.chatbotFeedback.findMany({
      where: {
        createdAt: {
          gte: yesterday,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (feedbackData.length === 0) {
      console.log('📭 [Daily AI Learning] No feedback in last 24 hours. Skipping...');
      return NextResponse.json({
        success: true,
        message: 'No feedback to process',
        stats: {
          feedbackCount: 0,
          documentsUpdated: 0,
        },
      });
    }

    console.log(`📊 [Daily AI Learning] Found ${feedbackData.length} feedback entries`);

    // 2. Tính điểm cho mỗi document từ sources
    const documentScores: Record<string, { score: number; count: number }> = {};

    for (const feedback of feedbackData) {
      const score = feedback.feedback === 'like' ? 1.0 : -0.5;
      
      // Parse sources JSON
      let sourceDocIds: string[] = [];
      if (feedback.sources) {
        try {
          sourceDocIds = JSON.parse(feedback.sources);
        } catch (e) {
          console.warn('⚠️ Failed to parse sources:', feedback.sources);
        }
      }

      // Cập nhật score cho mỗi document
      for (const docId of sourceDocIds) {
        if (!documentScores[docId]) {
          documentScores[docId] = { score: 0, count: 0 };
        }
        documentScores[docId].score += score;
        documentScores[docId].count += 1;
      }
    }

    console.log(`📈 [Daily AI Learning] Calculated scores for ${Object.keys(documentScores).length} documents`);

    // 3. Wake up Render server and sync scores
    const pythonBackendUrl = process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || 'http://127.0.0.1:8001';
    
    console.log('🚀 [Daily AI Learning] Waking up Render server...');
    
    // Import wake-up utility
    const { wakeUpRenderServer } = await import('@/lib/render-utils');
    const serverAwake = await wakeUpRenderServer(pythonBackendUrl, 6, 15000); // 6 retries, 15s delay
    
    if (!serverAwake) {
      console.error('❌ [Daily AI Learning] Failed to wake up Render server');
      return NextResponse.json(
        { 
          error: 'Failed to wake up Render server for learning',
          message: 'Render server could not be woken up. Please try again later.',
        },
        { status: 503 }
      );
    }

    console.log('✅ [Daily AI Learning] Render server is awake, syncing scores...');

    // 4. Đồng bộ scores lên Python backend
    let updatedCount = 0;

    for (const [docId, data] of Object.entries(documentScores)) {
      const avgScore = data.score / data.count;
      
      try {
        const response = await fetch(`${pythonBackendUrl}/feedback/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            docId: docId, // Fixed: should be docId not doc_id
            feedbackScore: avgScore,
          }),
          signal: AbortSignal.timeout(10000), // 10s timeout per update
        });

        if (response.ok) {
          updatedCount++;
        } else {
          console.warn(`⚠️ Failed to update doc ${docId}:`, await response.text());
        }
      } catch (error) {
        console.error(`❌ Error updating doc ${docId}:`, error);
      }
    }

    console.log(`✅ [Daily AI Learning] Updated ${updatedCount}/${Object.keys(documentScores).length} documents`);

    // 5. Save updated index to MongoDB after learning
    console.log('💾 [Daily AI Learning] Saving updated index to MongoDB...');
    try {
      const saveResponse = await fetch(`${pythonBackendUrl}/index/save-to-mongodb`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(60000), // 60s timeout for save
      });
      
      if (saveResponse.ok) {
        const saveData = await saveResponse.json();
        console.log('✅ [Daily AI Learning] Index saved to MongoDB:', saveData);
      } else {
        console.warn('⚠️ [Daily AI Learning] Failed to save to MongoDB:', await saveResponse.text());
      }
    } catch (e) {
      console.error('❌ [Daily AI Learning] Error saving to MongoDB:', e);
    }

    // 6. Phân tích top questions
    const questionStats: Record<string, { count: number; likeCount: number; dislikeCount: number }> = {};
    
    for (const feedback of feedbackData) {
      const normalizedQ = feedback.question.toLowerCase().trim();
      if (!questionStats[normalizedQ]) {
        questionStats[normalizedQ] = { count: 0, likeCount: 0, dislikeCount: 0 };
      }
      questionStats[normalizedQ].count += 1;
      if (feedback.feedback === 'like') {
        questionStats[normalizedQ].likeCount += 1;
      } else {
        questionStats[normalizedQ].dislikeCount += 1;
      }
    }

    const topQuestions = Object.entries(questionStats)
      .map(([question, stats]) => ({
        question,
        count: stats.count,
        avgScore: (stats.likeCount - stats.dislikeCount * 0.5) / stats.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 7. Tạo learning log
    const learningLog: LearningLogEntry = {
      timestamp: new Date().toISOString(),
      totalFeedback: feedbackData.length,
      likeCount: feedbackData.filter(f => f.feedback === 'like').length,
      dislikeCount: feedbackData.filter(f => f.feedback === 'dislike').length,
      documentsUpdated: updatedCount,
      topQuestions,
      improvements: [
        `Processed ${feedbackData.length} feedback entries`,
        `Updated scores for ${updatedCount} documents`,
        `Identified ${topQuestions.length} frequently asked questions`,
      ],
    };

    // 8. Lưu log vào database
    console.log('📝 [Daily AI Learning] Learning Summary:', learningLog);

    await prisma.aILearningLog.create({
      data: {
        totalFeedback: learningLog.totalFeedback,
        likeCount: learningLog.likeCount,
        dislikeCount: learningLog.dislikeCount,
        documentsUpdated: learningLog.documentsUpdated,
        topQuestions: JSON.stringify(learningLog.topQuestions),
        improvements: JSON.stringify(learningLog.improvements),
        learningDate: new Date(),
      },
    });

    console.log('💾 [Daily AI Learning] Log saved to database');

    return NextResponse.json({
      success: true,
      message: 'Daily AI learning completed successfully',
      stats: learningLog,
    });

  } catch (error) {
    console.error('❌ [Daily AI Learning] Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET endpoint để kiểm tra status
export async function GET() {
  return NextResponse.json({
    service: 'Daily AI Learning Cron',
    status: 'active',
    schedule: 'Daily at 00:00 (24h)',
    description: 'Automatically learns from user feedback and updates document scores',
    endpoint: 'POST /api/cron/daily-ai-learning',
    authRequired: 'Bearer token (CRON_SECRET)',
  });
}
