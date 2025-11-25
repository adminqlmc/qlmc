import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/utils/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'teacher') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Get booking statistics
    const [pending, approved, rejected, completed] = await Promise.all([
      prisma.booking.count({ where: { userId: user.userId, status: 'pending' } }),
      prisma.booking.count({ where: { userId: user.userId, status: 'approved' } }),
      prisma.booking.count({ where: { userId: user.userId, status: 'rejected' } }),
      prisma.booking.count({ where: { userId: user.userId, status: 'completed' } }),
    ]);

    // Get upcoming bookings
    const upcomingBookings = await prisma.booking.findMany({
      where: {
        userId: user.userId,
        status: { in: ['pending', 'approved'] },
        startTime: { gte: new Date() },
      },
      include: {
        projector: {
          select: { name: true },
        },
      },
      orderBy: { startTime: 'asc' },
      take: 10,
    });

    return NextResponse.json({
      stats: { pending, approved, rejected, completed },
      upcomingBookings,
    });
  } catch (error) {
    console.error('Error fetching teacher dashboard:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
