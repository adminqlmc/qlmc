import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getJwtPayload } from '@/lib/jwt';
import { startScheduledProjectorMaintenanceIfDue } from '@/utils/supportMaintenance';

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getJwtPayload(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get filter from query params
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    // Build where clause
    const where: any = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (priority && priority !== 'all') {
      where.priority = priority;
    }

  // Apply scheduled maintenance for devices if due
  try { await startScheduledProjectorMaintenanceIfDue(); } catch (e) { /* no-op */ }

  // Fetch support requests
    const supportRequests = await prisma.supportRequest.findMany({
      where,
      include: {
        projector: true,
        user: {
          select: {
            id: true,
            userID: true,
            fullName: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // pending first
        { priority: 'desc' }, // urgent first
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ supportRequests });
  } catch (error) {
    console.error('Error fetching support requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch support requests' },
      { status: 500 }
    );
  }
}
