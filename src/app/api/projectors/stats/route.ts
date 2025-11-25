import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * API lấy thống kê tổng quan cho HomePage
 * GET /api/projectors/stats
 */
export async function GET() {
  try {
    // Đếm tổng số máy chiếu
    const totalProjectors = await prisma.projector.count();

    // Đếm theo status
    const available = await prisma.projector.count({
      where: { status: 'available' }
    });

    const maintenance = await prisma.projector.count({
      where: { status: 'maintenance' }
    });

    const broken = await prisma.projector.count({
      where: { status: 'broken' }
    });

    return NextResponse.json({
      success: true,
      stats: {
        total: totalProjectors,
        available,
        maintenance,
        broken,
        inUse: totalProjectors - available - maintenance - broken, // Đang được sử dụng
      }
    });

  } catch (error) {
    console.error('Error fetching projector stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
