import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/utils/auth';
import { completeApprovedOverdue } from '@/utils/bookingMaintenance';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'teacher') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Resolve dynamic route param
    const { id } = await params;

  // Apply maintenance before fetching
  try { await completeApprovedOverdue(); } catch (e) { /* ignore */ }

  // Get my bookings for this projector
    const bookings = await prisma.booking.findMany({
      where: {
        projectorId: id,
        userId: user.userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
