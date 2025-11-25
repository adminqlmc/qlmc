import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/utils/auth';

// Get teacher's bookings for schedule view
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

    // Fetch teacher's bookings with approved or completed status
    const bookings = await prisma.booking.findMany({
      where: {
        userId: user.userId,
        status: {
          in: ['approved', 'completed'],
        },
      },
      include: {
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

    return NextResponse.json({
      bookings,
      total: bookings.length,
    });
  } catch (error) {
    console.error('Error fetching teacher schedule:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
