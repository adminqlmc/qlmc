import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getJwtPayload } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return NextResponse.json({ authenticated: false });
  
  const payload = await getJwtPayload(token);
  if (!payload) return NextResponse.json({ authenticated: false });

  // Get full user info from database
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      userID: true,
      fullName: true,
      email: true,
      googleEmail: true,
      role: true,
      avatar: true,
      isActive: true,
    },
  });

  if (!user) return NextResponse.json({ authenticated: false });

  return NextResponse.json({ 
    authenticated: true, 
    payload,
    user,
  });
}
