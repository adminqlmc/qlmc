import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { completeApprovedOverdue } from '@/utils/bookingMaintenance';
import { getCurrentUser } from '@/utils/auth';

// Get all bookings (admin only)
export async function GET(request: Request) {
  try {
    // Verify admin authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden - Admin only' }, { status: 403 });
    }

    // Get query params for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : undefined;

    // Build where clause
    const where: any = {};
    if (status && status !== 'all') {
      where.status = status;
    }

  // Apply maintenance before fetching
  try { await completeApprovedOverdue(); } catch (e) { /* no-op */ }

  // Fetch bookings with related data
    const bookings = await prisma.booking.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            userID: true,
            fullName: true,
            email: true,
          },
        },
        projector: {
          select: {
            id: true,
            name: true,
            model: true,
            serialNumber: true,
            room: true,
            building: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      ...(limit && { take: limit }),
    });

    return NextResponse.json({
      bookings,
      total: bookings.length,
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
