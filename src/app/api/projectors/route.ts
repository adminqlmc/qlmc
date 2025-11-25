import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const data = await prisma.projector.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const created = await prisma.projector.create({ data: body });
  return NextResponse.json(created, { status: 201 });
}
