import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJwtToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import dayjs from 'dayjs';

export async function GET() {
  try {
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

    // Get statistics
    const [pending, inProgress, resolved, allScheduled] = await Promise.all([
      prisma.supportRequest.count({
        where: {
          respondedBy: technicianUserID,
          status: 'pending',
        },
      }),
      prisma.supportRequest.count({
        where: {
          respondedBy: technicianUserID,
          status: 'in_progress',
        },
      }),
      prisma.supportRequest.count({
        where: {
          respondedBy: technicianUserID,
          status: 'resolved',
        },
      }),
      prisma.supportRequest.findMany({
        where: {
          respondedBy: technicianUserID,
          status: 'in_progress',
          scheduledStartTime: { not: null },
          scheduledEndTime: { not: null },
        },
      }),
    ]);

    // Filter today's scheduled tasks
    const today = dayjs().startOf('day');
    const tomorrow = dayjs().add(1, 'day').startOf('day');
    const todayScheduled = allScheduled.filter((req: any) => {
      if (!req.scheduledStartTime) return false;
      const scheduleDate = dayjs(req.scheduledStartTime);
      return scheduleDate.isAfter(today) && scheduleDate.isBefore(tomorrow);
    });

    // Get urgent requests
    const urgentRequests = await prisma.supportRequest.findMany({
      where: {
        respondedBy: technicianUserID,
        status: {
          in: ['pending', 'in_progress'],
        },
        priority: 'urgent',
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
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    // Get today's schedule details
    const todayScheduleDetails = await prisma.supportRequest.findMany({
      where: {
        id: {
          in: todayScheduled.map((s: any) => s.id),
        },
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
      orderBy: {
        scheduledStartTime: 'asc',
      },
    });

    return NextResponse.json({
      statistics: {
        pending,
        inProgress,
        resolved,
        todayScheduled: todayScheduled.length,
      },
      urgentRequests,
      todaySchedule: todayScheduleDetails,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
