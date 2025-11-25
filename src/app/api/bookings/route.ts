import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { completeApprovedOverdue } from '@/utils/bookingMaintenance';
import dayjs from 'dayjs';
import type { Booking } from '@prisma/client';

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return dayjs(aStart).isBefore(bEnd) && dayjs(bStart).isBefore(aEnd);
}

export async function GET() {
  // Apply maintenance: auto-complete approved bookings past endTime
  try { await completeApprovedOverdue(); } catch (e) { /* ignore to not block */ }
  const data = await prisma.booking.findMany({ orderBy: { startTime: 'desc' } });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { projectorId, userId, startTime, endTime, purpose } = body;

  // Validate required fields
  if (!projectorId || !userId || !startTime || !endTime || !purpose) {
    return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
  }

  // Conflict check
  const existing = await prisma.booking.findMany({
    where: { projectorId },
  });
  const aStart = new Date(startTime);
  const aEnd = new Date(endTime);
  const conflict = existing.some((b: Booking) => overlaps(aStart, aEnd, b.startTime, b.endTime));
  if (conflict) {
    return NextResponse.json({ message: 'Thời gian bị trùng lịch' }, { status: 409 });
  }

  const created = await prisma.booking.create({ 
    data: { 
      projectorId, 
      userId, 
      startTime: aStart, 
      endTime: aEnd,
      purpose,
      status: 'pending',
    } 
  });
  return NextResponse.json(created, { status: 201 });
}
