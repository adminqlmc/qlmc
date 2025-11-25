import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/utils/auth';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'teacher') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { projectorId, startTime, endTime, purpose } = body;

    if (!projectorId || !startTime || !endTime || !purpose) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Parse time in Vietnam timezone (UTC+7)
    const start = dayjs(startTime).tz('Asia/Ho_Chi_Minh');
    const end = dayjs(endTime).tz('Asia/Ho_Chi_Minh');

    // Validate time range 6h-22h (using Vietnam time)
    const startHour = start.hour();
    const endHour = end.hour();

    if (startHour < 6 || startHour >= 22 || endHour < 6 || endHour > 22) {
      return NextResponse.json(
        { message: 'Thời gian mượn phải trong khoảng 6h - 22h' },
        { status: 400 }
      );
    }

    if (start.isAfter(end) || start.isSame(end)) {
      return NextResponse.json(
        { message: 'Thời gian kết thúc phải sau thời gian bắt đầu' },
        { status: 400 }
      );
    }

    // Check for conflicts with pending or approved bookings
    const conflicts = await prisma.booking.findMany({
      where: {
        projectorId,
        status: { in: ['pending', 'approved'] },
        OR: [
          {
            AND: [
              { startTime: { lte: start.toDate() } },
              { endTime: { gt: start.toDate() } },
            ],
          },
          {
            AND: [
              { startTime: { lt: end.toDate() } },
              { endTime: { gte: end.toDate() } },
            ],
          },
          {
            AND: [
              { startTime: { gte: start.toDate() } },
              { endTime: { lte: end.toDate() } },
            ],
          },
        ],
      },
    });

    if (conflicts.length > 0) {
      return NextResponse.json(
        { message: 'Thời gian này đã có lịch đặt khác (chờ duyệt hoặc đã duyệt)' },
        { status: 409 }
      );
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        projectorId,
        userId: user.userId,
        startTime: start.toDate(),
        endTime: end.toDate(),
        purpose,
        status: 'pending',
      },
    });

    return NextResponse.json({
      message: 'Đặt lịch thành công',
      booking,
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
