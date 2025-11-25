import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering for API routes
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * AI Learning History API
 * 
 * GET /api/admin/ai-learning-history
 * Xem lịch sử học tập của AI theo ngày
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '7');
    const limit = parseInt(searchParams.get('limit') || '30');

    // Lấy learning logs gần đây
    const logs = await prisma.aILearningLog.findMany({
      orderBy: {
        learningDate: 'desc',
      },
      take: limit,
    });

    // Parse JSON fields
    const parsedLogs = logs.map(log => ({
      id: log.id,
      totalFeedback: log.totalFeedback,
      likeCount: log.likeCount,
      dislikeCount: log.dislikeCount,
      documentsUpdated: log.documentsUpdated,
      topQuestions: JSON.parse(log.topQuestions),
      improvements: JSON.parse(log.improvements),
      learningDate: log.learningDate,
      createdAt: log.createdAt,
    }));

    // Tính stats tổng quan
    const stats = {
      totalLogs: logs.length,
      totalFeedbackProcessed: logs.reduce((sum, log) => sum + log.totalFeedback, 0),
      totalLikes: logs.reduce((sum, log) => sum + log.likeCount, 0),
      totalDislikes: logs.reduce((sum, log) => sum + log.dislikeCount, 0),
      avgFeedbackPerDay: logs.length > 0 ? logs.reduce((sum, log) => sum + log.totalFeedback, 0) / logs.length : 0,
      avgDocumentsUpdatedPerDay: logs.length > 0 ? logs.reduce((sum, log) => sum + log.documentsUpdated, 0) / logs.length : 0,
    };

    return NextResponse.json({
      success: true,
      logs: parsedLogs,
      stats,
    });

  } catch (error) {
    console.error('Error fetching AI learning history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
