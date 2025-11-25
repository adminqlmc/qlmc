import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// API to check and update projector status based on scheduled maintenance
export async function GET(req: NextRequest) {
  try {
    const now = new Date();

    // Find all in_progress support requests with scheduled time
    const scheduledRequests = await prisma.supportRequest.findMany({
      where: {
        status: 'in_progress',
        projectorId: { not: null },
        scheduledStartTime: { not: null },
        scheduledEndTime: { not: null },
      },
      include: {
        projector: true,
      },
    });

    let updatedCount = 0;

    for (const request of scheduledRequests) {
      if (!request.projector || !request.scheduledStartTime || !request.scheduledEndTime) {
        continue;
      }

      const startTime = new Date(request.scheduledStartTime);
      const endTime = new Date(request.scheduledEndTime);

      // If current time is within scheduled maintenance window
      if (now >= startTime && now <= endTime) {
        // Update projector to maintenance if not already
        if (request.projector.status !== 'maintenance') {
          await prisma.projector.update({
            where: { id: request.projector.id },
            data: {
              status: 'maintenance',
              lastMaintenanceDate: now,
            },
          });
          updatedCount++;
        }
      }
    }

    return NextResponse.json({
      message: 'Projector statuses updated successfully',
      updatedCount,
      checkedAt: now.toISOString(),
    });
  } catch (error) {
    console.error('Error updating projector statuses:', error);
    return NextResponse.json(
      { error: 'Failed to update projector statuses' },
      { status: 500 }
    );
  }
}
