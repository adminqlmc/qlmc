import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/utils/auth';

export async function POST(request: Request) {
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

    // Validate required fields
    if (!name || !model || !serialNumber || !room || !building || !status || !purchaseDate || !warrantyExpiry) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if serial number already exists
    const existing = await prisma.projector.findUnique({
      where: { serialNumber },
    });

    if (existing) {
      return NextResponse.json(
        { message: 'Serial number already exists' },
        { status: 400 }
      );
    }

    // Create projector
    const projector = await prisma.projector.create({
      data: {
        name,
        model,
        serialNumber,
        room,
        building,
        status,
        purchaseDate: new Date(purchaseDate),
        warrantyExpiry: new Date(warrantyExpiry),
        timeUsed: 0,
      },
    });

    return NextResponse.json({
      message: 'Projector created successfully',
      projector,
    });
  } catch (error) {
    console.error('Error creating projector:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
