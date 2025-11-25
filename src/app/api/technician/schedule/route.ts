import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJwtToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJwtToken(token);
    if (!payload || typeof payload === 'string' || payload.role !== 'technician') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const technicianUserID = payload.userID as string;

    // Get all scheduled maintenance tasks
    const schedules = await prisma.supportRequest.findMany({
      where: {
        respondedBy: technicianUserID,
        status: 'in_progress',
        scheduledStartTime: { not: null },
        scheduledEndTime: { not: null },
      },
      include: {
        user: {
          select: {
            userID: true,
            fullName: true,
          },
        },
        projector: {
          select: {
            name: true,
            room: true,
            building: true,
          },
        },
      },
      orderBy: {
        scheduledStartTime: 'asc',
      },
    });

    return NextResponse.json({ schedules });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
