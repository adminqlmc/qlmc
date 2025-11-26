import { NextResponse } from 'next/server';

/**
 * Test AI Learning System Health
 * GET /api/test/ai-learning-health
 */
export async function GET() {
  try {
    const checks = {
      timestamp: new Date().toISOString(),
      env: {
        PY_CHATBOT_URL: process.env.PY_CHATBOT_URL || 'NOT SET',
        NEXT_PUBLIC_PYTHON_BACKEND_URL: process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || 'NOT SET',
        CRON_SECRET: process.env.CRON_SECRET ? 'SET' : 'NOT SET',
      },
      tests: [] as any[],
    };

    // Test 1: Python Backend Health
    const pythonUrl = process.env.PY_CHATBOT_URL || process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL;
    if (pythonUrl) {
      try {
        const healthRes = await fetch(`${pythonUrl}/health`, {
          signal: AbortSignal.timeout(5000),
        });
        checks.tests.push({
          name: 'Python Backend Health',
          status: healthRes.ok ? 'PASS' : 'FAIL',
          url: `${pythonUrl}/health`,
          statusCode: healthRes.status,
        });
      } catch (e: any) {
        checks.tests.push({
          name: 'Python Backend Health',
          status: 'ERROR',
          error: e.message,
        });
      }
    } else {
      checks.tests.push({
        name: 'Python Backend Health',
        status: 'SKIP',
        reason: 'No Python backend URL configured',
      });
    }

    // Test 2: Feedback Scores Endpoint
    if (pythonUrl) {
      try {
        const scoresRes = await fetch(`${pythonUrl}/feedback/scores`, {
          signal: AbortSignal.timeout(5000),
        });
        const scoresData = await scoresRes.json();
        checks.tests.push({
          name: 'Feedback Scores',
          status: 'PASS',
          count: scoresData.count || 0,
          hasScores: scoresData.count > 0,
        });
      } catch (e: any) {
        checks.tests.push({
          name: 'Feedback Scores',
          status: 'ERROR',
          error: e.message,
        });
      }
    }

    // Test 3: Database Connection (simple check)
    checks.tests.push({
      name: 'Database Config',
      status: process.env.DATABASE_URL ? 'CONFIGURED' : 'NOT CONFIGURED',
    });

    // Test 4: Recent Feedback Count
    try {
      const { prisma } = await import('@/lib/prisma');
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const feedbackCount = await prisma.chatbotFeedback.count({
        where: {
          createdAt: {
            gte: yesterday,
          },
        },
      });

      checks.tests.push({
        name: 'Recent Feedback (24h)',
        status: 'PASS',
        count: feedbackCount,
      });
    } catch (e: any) {
      checks.tests.push({
        name: 'Recent Feedback (24h)',
        status: 'ERROR',
        error: e.message,
      });
    }

    // Test 5: Recent Learning Logs
    try {
      const { prisma } = await import('@/lib/prisma');
      const logsCount = await prisma.aILearningLog.count();
      const latestLog = await prisma.aILearningLog.findFirst({
        orderBy: { learningDate: 'desc' },
      });

      checks.tests.push({
        name: 'Learning Logs',
        status: 'PASS',
        totalLogs: logsCount,
        latestDate: latestLog?.learningDate || null,
      });
    } catch (e: any) {
      checks.tests.push({
        name: 'Learning Logs',
        status: 'ERROR',
        error: e.message,
      });
    }

    // Overall status
    const allPass = checks.tests.every(t => t.status === 'PASS' || t.status === 'CONFIGURED');
    
    return NextResponse.json({
      status: allPass ? 'HEALTHY' : 'DEGRADED',
      ...checks,
    });

  } catch (error: any) {
    return NextResponse.json(
      { 
        status: 'ERROR',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
