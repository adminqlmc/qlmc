import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJwtToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import dayjs from 'dayjs';

/**
 * API lấy thống kê dashboard cho Admin
 * GET /api/admin/dashboard-stats
 */
export async function GET() {
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

    // Đếm tổng số users
    const totalUsers = await prisma.user.count();

    // Đếm tổng số projectors
    const totalProjectors = await prisma.projector.count();

    // Đếm bookings chờ duyệt
    const pendingBookings = await prisma.booking.count({
      where: { status: 'pending' }
    });

    // Đếm bookings hoàn thành trong tuần này
    const startOfWeek = dayjs().startOf('week').toDate();
    const endOfWeek = dayjs().endOf('week').toDate();
    
    const completedBookings = await prisma.booking.count({
      where: {
        status: 'completed',
        endTime: {
          gte: startOfWeek,
          lte: endOfWeek,
        }
      }
    });

    // Đếm thiết bị đang bảo trì
    const maintenanceDevices = await prisma.projector.count({
      where: { status: 'maintenance' }
    });

    // Đếm thiết bị hỏng
    const brokenDevices = await prisma.projector.count({
      where: { status: 'broken' }
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalProjectors,
        pendingBookings,
        completedBookings,
        maintenanceDevices,
        brokenDevices,
      }
    });

  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
