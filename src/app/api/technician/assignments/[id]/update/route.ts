import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJwtToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
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
    const { id } = await context.params;
    const body = await request.json();
    const { status, response, projectorStatus } = body;

    // Verify the request is assigned to this technician
    const supportRequest = await prisma.supportRequest.findUnique({
      where: { id },
      include: { projector: true },
    });

    if (!supportRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (supportRequest.respondedBy !== technicianUserID) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update support request
    const updatedRequest = await prisma.supportRequest.update({
      where: { id },
      data: {
        status,
        response,
        updatedAt: new Date(),
      },
    });

    // Update projector status if provided
    if (projectorStatus && supportRequest.projectorId) {
      await prisma.projector.update({
        where: { id: supportRequest.projectorId },
        data: { status: projectorStatus },
      });
    }

    return NextResponse.json({ 
      success: true,
      request: updatedRequest,
    });
  } catch (error) {
    console.error('Error updating assignment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
