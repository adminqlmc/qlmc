import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/utils/auth';

// Update projector
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, model, serialNumber, room, building, status, purchaseDate, warrantyExpiry } = body;

    // Resolve dynamic route param
    const { id } = await params;

    // Check if projector exists
    const existing = await prisma.projector.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { message: 'Projector not found' },
        { status: 404 }
      );
    }

    // Check if serial number is being changed to one that already exists
    if (serialNumber && serialNumber !== existing.serialNumber) {
      const duplicate = await prisma.projector.findUnique({
        where: { serialNumber },
      });

      if (duplicate) {
        return NextResponse.json(
          { message: 'Serial number already exists' },
          { status: 400 }
        );
      }
    }

    // Update projector
    const projector = await prisma.projector.update({
      where: { id },
      data: {
        name,
        model,
        serialNumber,
        room,
        building,
        status,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
        warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : undefined,
      },
    });

    return NextResponse.json({
      message: 'Projector updated successfully',
      projector,
    });
  } catch (error) {
    console.error('Error updating projector:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete projector
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Resolve dynamic route param
    const { id } = await params;

    // Check if projector exists
    const existing = await prisma.projector.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { message: 'Projector not found' },
        { status: 404 }
      );
    }

    // Delete projector (will cascade delete related bookings and issues)
    await prisma.projector.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Projector deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting projector:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
