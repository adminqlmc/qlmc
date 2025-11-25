import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/utils/auth';

// Schedule maintenance for a projector
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
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
    const { maintenanceDate, notes } = body;

    if (!maintenanceDate) {
      return NextResponse.json(
        { message: 'Maintenance date is required' },
        { status: 400 }
      );
    }

    // Check if projector exists
    const existing = await prisma.projector.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { message: 'Projector not found' },
        { status: 404 }
      );
    }

    // Update projector with maintenance date
    const projector = await prisma.projector.update({
      where: { id: params.id },
      data: {
        lastMaintenanceDate: new Date(maintenanceDate),
        status: 'maintenance', // Set status to maintenance
      },
    });

    // Note: In a real application, you might want to create a separate Maintenance model
    // to track maintenance history with notes, technicians, etc.
    // For now, we're just updating the lastMaintenanceDate field

    return NextResponse.json({
      message: 'Maintenance scheduled successfully',
      projector,
      notes, // Return notes for logging purposes
    });
  } catch (error) {
    console.error('Error scheduling maintenance:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
