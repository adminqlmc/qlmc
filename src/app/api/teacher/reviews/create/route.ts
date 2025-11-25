import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getJwtPayload } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getJwtPayload(token);
    if (!user || user.role !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get request body
    const { bookingId, level, comment } = await req.json();

    // Validate required fields
    if (!bookingId || !level) {
      return NextResponse.json(
        { error: 'bookingId and level are required' },
        { status: 400 }
      );
    }

    // Validate level
    const allowed = ['good', 'usable', 'broken'] as const;
    if (!allowed.includes(level)) {
      return NextResponse.json(
        { error: 'Invalid level. Must be one of good | usable | broken' },
        { status: 400 }
      );
    }

    // Check if booking exists and belongs to this teacher
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { review: true },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.userId !== user.userId) {
      return NextResponse.json(
        { error: 'You can only review your own bookings' },
        { status: 403 }
      );
    }

    if (booking.status !== 'completed') {
      return NextResponse.json(
        { error: 'You can only review completed bookings' },
        { status: 400 }
      );
    }

    if (booking.review) {
      return NextResponse.json(
        { error: 'This booking has already been reviewed' },
        { status: 400 }
      );
    }

    // Map level to numeric rating for storage compatibility
    const rating = level === 'good' ? 5 : level === 'usable' ? 3 : 1;

    // If broken, require comment (incident description)
    if (level === 'broken' && (!comment || String(comment).trim().length === 0)) {
      return NextResponse.json(
        { error: 'Vui lòng mô tả sự cố khi chọn Hỏng/Sự cố' },
        { status: 400 }
      );
    }

    // Create review first
    const review = await prisma.review.create({
      data: {
        bookingId,
        rating,
        comment: comment ? String(comment) : null,
      },
    });

    // If broken, also create a SupportRequest for admin handling
    if (level === 'broken') {
      try {
        await prisma.supportRequest.create({
          data: {
            userId: user.userId,
            projectorId: booking.projectorId ?? null,
            title: 'Sự cố thiết bị sau khi sử dụng',
            description: String(comment),
            priority: 'high',
            status: 'pending',
            category: 'repair',
          },
        });
      } catch (e) {
        // Do not fail the review creation if support request creation fails
        console.error('Failed to create support request from broken review:', e);
      }
    }

    return NextResponse.json(
      { message: 'Review created successfully', review },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
}
