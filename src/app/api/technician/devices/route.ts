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

    // Get all devices
    const devices = await prisma.projector.findMany({
      orderBy: [
        { status: 'asc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json({ devices });
  } catch (error) {
    console.error('Error fetching devices:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
