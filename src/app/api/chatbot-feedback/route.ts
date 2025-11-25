import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/utils/auth';

// API để lưu feedback (like/dislike) cho câu trả lời của chatbot
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { question, answer, feedback, sources } = await req.json();

    // Validate feedback type
    if (!['like', 'dislike'].includes(feedback)) {
      return NextResponse.json({ error: 'Invalid feedback type. Must be "like" or "dislike"' }, { status: 400 });
    }

    if (!question || !answer) {
      return NextResponse.json({ error: 'Missing question or answer' }, { status: 400 });
    }

    // Save feedback to database
    const feedbackRecord = await prisma.chatbotFeedback.create({
      data: {
        userId: (user as any).userId || (user as any).id,
        question: question.toString().slice(0, 4000),
        answer: answer.toString().slice(0, 4000),
        feedback,
        sources: sources ? JSON.stringify(sources) : null,
      },
    });

    // Real-time learning: Update Python backend with feedback score
    try {
      const baseUrl = process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || process.env.PY_CHATBOT_URL || 'http://127.0.0.1:8001';
      
      // Extract docIds from sources
      if (sources && Array.isArray(sources)) {
        for (const docId of sources) {
          const feedbackScore = feedback === 'like' ? 1.0 : -0.5;
          await fetch(`${baseUrl}/feedback/update`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ docId, feedbackScore }),
          }).catch(() => {
            // Ignore errors - learning is best-effort
          });
        }
      }
    } catch (e) {
      // Don't fail if learning update fails
      console.error('Failed to update AI learning:', e);
    }

    return NextResponse.json({ 
      success: true, 
      message: feedback === 'like' 
        ? 'Cảm ơn bạn đã đánh giá tích cực! AI đang học từ phản hồi này.' 
        : 'Cảm ơn phản hồi của bạn! AI sẽ cải thiện câu trả lời.',
      feedbackId: feedbackRecord.id 
    });
  } catch (error: any) {
    console.error('Error saving chatbot feedback:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      detail: String(error?.message || error) 
    }, { status: 500 });
  }
}

// API để lấy thống kê feedback (dành cho Admin/Technician)
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'admin' && user.role !== 'technician')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Thống kê tổng số like/dislike
    const stats = await prisma.chatbotFeedback.groupBy({
      by: ['feedback'],
      _count: {
        id: true,
      },
    });

    // Lấy feedback gần đây
    const recentFeedback = await prisma.chatbotFeedback.findMany({
      take: 50,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            userID: true,
            fullName: true,
            role: true,
          },
        },
      },
    });

    // Lấy các câu hỏi bị dislike nhiều để cải thiện
    const topDisliked = await prisma.chatbotFeedback.findMany({
      where: {
        feedback: 'dislike',
      },
      take: 20,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            userID: true,
            fullName: true,
          },
        },
      },
    });

    return NextResponse.json({
      stats,
      recentFeedback,
      topDisliked,
    });
  } catch (error: any) {
    console.error('Error fetching feedback stats:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      detail: String(error?.message || error) 
    }, { status: 500 });
  }
}
