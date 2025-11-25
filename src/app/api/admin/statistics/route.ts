import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJwtToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import dayjs from 'dayjs';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJwtToken(token);
    if (!payload || typeof payload === 'string' || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate') || dayjs().startOf('week').format('YYYY-MM-DD');
    const endDate = searchParams.get('endDate') || dayjs().endOf('week').format('YYYY-MM-DD');

    const startDateTime = dayjs(startDate).startOf('day').toDate();
    const endDateTime = dayjs(endDate).endOf('day').toDate();

    // Get all completed/approved bookings in the date range
    const bookings = await prisma.booking.findMany({
      where: {
        status: {
          in: ['approved', 'completed'],
        },
        startTime: {
          gte: startDateTime,
          lte: endDateTime,
        },
      },
      include: {
        projector: true,
        review: true,
      },
    });

    // Calculate device usage data (total hours per device)
    const deviceUsageMap = new Map<string, { name: string; hours: number; bookingCount: number }>();
    
    bookings.forEach((booking) => {
      const deviceId = booking.projector.id;
      const deviceName = `${booking.projector.name} (${booking.projector.room})`;
      const duration = dayjs(booking.endTime).diff(dayjs(booking.startTime), 'hour', true);
      
      if (deviceUsageMap.has(deviceId)) {
        const current = deviceUsageMap.get(deviceId)!;
        current.hours += duration;
        current.bookingCount += 1;
      } else {
        deviceUsageMap.set(deviceId, {
          name: deviceName,
          hours: duration,
          bookingCount: 1,
        });
      }
    });

    const deviceUsage = Array.from(deviceUsageMap.values())
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 10); // Top 10 devices

    // Get all projectors for status distribution
    const allProjectors = await prisma.projector.findMany({
      select: {
        status: true,
      },
    });

    const statusMap = new Map<string, number>();
    allProjectors.forEach((projector) => {
      const status = projector.status;
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    });

    const statusDistribution = [
      { 
        name: 'Sẵn sàng', 
        value: statusMap.get('available') || 0,
        color: '#52c41a',
      },
      { 
        name: 'Bảo trì', 
        value: statusMap.get('maintenance') || 0,
        color: '#faad14',
      },
      { 
        name: 'Hỏng', 
        value: statusMap.get('broken') || 0,
        color: '#ff4d4f',
      },
    ].filter(item => item.value > 0);

    // Get rating distribution from reviews
    const reviews = bookings
      .filter((b) => b.review)
      .map((b) => b.review!);

    const ratingMap = new Map<number, number>();
    reviews.forEach((review) => {
      const rating = review.rating;
      ratingMap.set(rating, (ratingMap.get(rating) || 0) + 1);
    });

    const ratingColors = ['#ff4d4f', '#ff7a45', '#ffa940', '#fadb14', '#52c41a'];
    const ratingDistribution = [1, 2, 3, 4, 5]
      .map((star) => ({
        name: `${star} sao`,
        value: ratingMap.get(star) || 0,
        color: ratingColors[star - 1],
      }))
      .filter(item => item.value > 0);

    // Calculate totals
    const totalHours = bookings.reduce((sum, booking) => {
      return sum + dayjs(booking.endTime).diff(dayjs(booking.startTime), 'hour', true);
    }, 0);

    const totalBookings = bookings.length;
    const totalDevices = allProjectors.length;

    return NextResponse.json({
      deviceUsage,
      statusDistribution,
      ratingDistribution: ratingDistribution.length > 0 ? ratingDistribution : [
        { name: 'Chưa có đánh giá', value: 1, color: '#d9d9d9' }
      ],
      totalHours,
      totalBookings,
      totalDevices,
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
