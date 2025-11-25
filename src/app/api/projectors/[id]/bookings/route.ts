import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/utils/auth';
import { completeApprovedOverdue } from '@/utils/bookingMaintenance';

// Get bookings for a projector
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Apply maintenance before fetching
    try { await completeApprovedOverdue(); } catch (e) { /* ignore */ }

    const { id } = await params;

    // Fetch bookings for this projector
    const bookings = await prisma.booking.findMany({
      where: {
        projectorId: id,
      },
      include: {
        user: {
          select: {
            fullName: true,
            userID: true,
          },
        },
      },
      orderBy: {
        startTime: 'desc',
      },
    });

    return NextResponse.json({
      bookings,
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
