import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJwtToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { startScheduledProjectorMaintenanceIfDue } from '@/utils/supportMaintenance';

export async function GET() {
  try {
    // Ensure any due maintenance switches projector status to maintenance
    try { await startScheduledProjectorMaintenanceIfDue(); } catch (e) { /* no-op */ }
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJwtToken(token);
    if (!payload || typeof payload === 'string' || payload.role !== 'technician') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const technicianUserID = payload.userID as string;

    // Get all support requests assigned to this technician
    const requests = await prisma.supportRequest.findMany({
      where: {
        respondedBy: technicianUserID,
      },
      include: {
        user: {
          select: {
            userID: true,
            fullName: true,
            email: true,
          },
        },
        projector: {
          select: {
            id: true,
            name: true,
            room: true,
            building: true,
            status: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // pending first
        { priority: 'desc' }, // urgent first
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
