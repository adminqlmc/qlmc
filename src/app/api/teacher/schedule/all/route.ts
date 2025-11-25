import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/utils/auth';

// Get all bookings grouped by projector for schedule view
export async function GET() {
  try {
    // Verify teacher authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'teacher') {
      return NextResponse.json({ message: 'Forbidden - Teacher only' }, { status: 403 });
    }

    // Fetch all approved and completed bookings for all projectors
    const bookings = await prisma.booking.findMany({
      where: {
        status: {
          in: ['approved', 'completed'],
        },
      },
      include: {
        user: {
          select: {
            id: true,
            userID: true,
            fullName: true,
          },
        },
        projector: {
          select: {
            id: true,
            name: true,
            model: true,
            room: true,
            building: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // Get all projectors
    const projectors = await prisma.projector.findMany({
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        model: true,
        room: true,
        building: true,
      },
    });

    // Get scheduled maintenance periods
    const maintenanceSchedules = await prisma.supportRequest.findMany({
      where: {
        status: 'in_progress',
        projectorId: { not: null },
        scheduledStartTime: { not: null },
        scheduledEndTime: { not: null },
      },
      select: {
        id: true,
        projectorId: true,
        scheduledStartTime: true,
        scheduledEndTime: true,
        title: true,
        respondedBy: true,
      },
    });

    return NextResponse.json({
      bookings,
      projectors,
      maintenanceSchedules,
      total: bookings.length,
    });
  } catch (error) {
    console.error('Error fetching all schedules:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
