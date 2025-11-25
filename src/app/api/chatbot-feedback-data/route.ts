import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * API endpoint để Python AI service lấy feedback data
 * Endpoint này không yêu cầu authentication để Python service có thể gọi
 */
export async function GET(req: NextRequest) {
  try {
    // Lấy tất cả feedback đã được đánh giá
    const feedbackData = await prisma.chatbotFeedback.findMany({
      select: {
        question: true,
        answer: true,
        feedback: true,
        sources: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Phân nhóm theo like/dislike
    const liked = feedbackData
      .filter(f => f.feedback === 'like')
      .map(f => ({
        question: f.question,
        answer: f.answer,
        sources: f.sources ? JSON.parse(f.sources) : [],
      }));

    const disliked = feedbackData
      .filter(f => f.feedback === 'dislike')
      .map(f => ({
        question: f.question,
        answer: f.answer,
        sources: f.sources ? JSON.parse(f.sources) : [],
      }));

    return NextResponse.json({
      success: true,
      liked,
      disliked,
      total: feedbackData.length,
      likeCount: liked.length,
      dislikeCount: disliked.length,
    });
  } catch (error: any) {
    console.error('Error fetching feedback data:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      detail: String(error?.message || error) 
    }, { status: 500 });
  }
}
