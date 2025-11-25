import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { completeApprovedOverdue } from '@/utils/bookingMaintenance';
import { getCurrentUser } from '@/utils/auth';

// Force dynamic rendering for API routes
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Get all pending bookings (admin only)
export async function GET() {
  try {
    // Verify admin authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden - Admin only' }, { status: 403 });
    }

  // Apply maintenance before fetching
  try { await completeApprovedOverdue(); } catch (e) { /* no-op */ }

  // Fetch all pending bookings with related data
    const bookings = await prisma.booking.findMany({
      where: {
        status: 'pending',
      },
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
    });

    return NextResponse.json({
      bookings,
      total: bookings.length,
    });
  } catch (error) {
    console.error('Error fetching pending bookings:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
