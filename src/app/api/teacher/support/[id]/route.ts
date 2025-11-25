import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getJwtPayload } from '@/lib/jwt';

export async function DELETE(
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
    if (!user || user.role !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const params = await context.params;
    const { id } = params;

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

    // Check ownership
    if (supportRequest.userId !== user.userId) {
      return NextResponse.json(
        { error: 'You can only delete your own support requests' },
        { status: 403 }
      );
    }

    // Only allow deletion of pending requests
    if (supportRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending support requests can be deleted' },
        { status: 400 }
      );
    }

    // Delete support request
    await prisma.supportRequest.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: 'Support request deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting support request:', error);
    return NextResponse.json(
      { error: 'Failed to delete support request' },
      { status: 500 }
    );
  }
}
