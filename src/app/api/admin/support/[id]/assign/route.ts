import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getJwtPayload } from '@/lib/jwt';

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getJwtPayload(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const params = await context.params;
    const { id } = params;
    const { technicianUserID, scheduledStartTime, scheduledEndTime } = await req.json();

    // Validate required fields
    if (!technicianUserID || !scheduledStartTime || !scheduledEndTime) {
      return NextResponse.json(
        { error: 'Technician ID, start time, and end time are required' },
        { status: 400 }
      );
    }

    // Validate time range
    const startTime = new Date(scheduledStartTime);
    const endTime = new Date(scheduledEndTime);
    
    if (endTime <= startTime) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      );
    }

    // Check if support request exists
    const supportRequest = await prisma.supportRequest.findUnique({
      where: { id },
    });

    if (!supportRequest) {
      return NextResponse.json(
        { error: 'Support request not found' },
        { status: 404 }
      );
    }

    // Check if technician exists
    const technician = await prisma.user.findFirst({
      where: {
        userID: technicianUserID,
        role: 'technician',
        isActive: true,
      },
    });

    if (!technician) {
      return NextResponse.json(
        { error: 'Technician not found or inactive' },
        { status: 404 }
      );
    }

    // Update support request
    const updatedRequest = await prisma.supportRequest.update({
      where: { id },
      data: {
        status: 'in_progress',
        respondedBy: technician.userID,
        respondedAt: new Date(),
        scheduledStartTime: startTime,
        scheduledEndTime: endTime,
      },
      include: {
        projector: true,
        user: {
          select: {
            id: true,
            userID: true,
            fullName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    // Check if scheduled time has already started
    const now = new Date();
    if (now >= startTime && supportRequest.projectorId) {
      // Update projector status to maintenance immediately
      await prisma.projector.update({
        where: { id: supportRequest.projectorId },
        data: { 
          status: 'maintenance',
          lastMaintenanceDate: now,
        },
      });
    }

    return NextResponse.json(
      { message: 'Technician assigned successfully', supportRequest: updatedRequest },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error assigning technician:', error);
    return NextResponse.json(
      { error: 'Failed to assign technician' },
      { status: 500 }
    );
  }
}
