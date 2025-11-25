import { NextRequest, NextResponse } from 'next/server';
import { startScheduledProjectorMaintenanceIfDue } from '@/utils/supportMaintenance';
import { getCurrentUser } from '@/utils/auth';

// Cron endpoint: set projector status to maintenance when scheduled start time arrives
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
      const user = await getCurrentUser();
      if (!user || user.role !== 'admin') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }
    }

    const updated = await startScheduledProjectorMaintenanceIfDue();
    return NextResponse.json({ updated });
  } catch (error) {
    console.error('Cron start-scheduled-maintenance error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
