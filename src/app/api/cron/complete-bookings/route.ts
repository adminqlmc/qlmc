import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/utils/auth';

/**
 * Cron endpoint: mark approved bookings as completed after their end time.
 *
 * Security:
 * - If process.env.CRON_SECRET is set, require header `x-cron-key` or query param `key` to match.
 * - Otherwise (no CRON_SECRET), require logged-in admin (useful for manual triggering during development).
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret) {
      const key = req.headers.get('x-cron-key') || url.searchParams.get('key');
      if (key !== cronSecret) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }
    } else {
      // Fallback for local/dev: allow admin to invoke manually
      const user = await getCurrentUser();
      if (!user || user.role !== 'admin') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }
    }

    const now = new Date();

    // Update all approved bookings whose end time has passed to completed
    const result = await prisma.booking.updateMany({
      where: {
        status: 'approved',
        endTime: { lte: now },
      },
      data: { status: 'completed' },
    });

    return NextResponse.json({
      updated: result.count,
      runAt: now.toISOString(),
    });
  } catch (error) {
    console.error('Cron complete-bookings error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
