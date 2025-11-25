import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword } from '@/lib/bcrypt';
import { signJwtToken } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  const { userID, password } = await req.json();
  
  // Tìm user theo userID
  const user = await prisma.user.findUnique({ where: { userID } });
  if (!user) return NextResponse.json({ message: 'Tài khoản hoặc mật khẩu không đúng' }, { status: 401 });

  // Kiểm tra mật khẩu
  const ok = await comparePassword(password, user.password);
  if (!ok) return NextResponse.json({ message: 'Tài khoản hoặc mật khẩu không đúng' }, { status: 401 });

  // Kiểm tra tài khoản có active không
  if (!user.isActive) return NextResponse.json({ message: 'Tài khoản đã bị vô hiệu hóa' }, { status: 403 });

  // Tạo JWT token với thông tin user
  const token = signJwtToken({ 
    userId: user.id, 
    userID: user.userID,
    fullName: user.fullName,
    role: user.role 
  });

  const res = NextResponse.json({ 
    message: 'Đăng nhập thành công',
    user: {
      id: user.id,
      userID: user.userID,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      avatar: user.avatar
    }
  });
  
  res.cookies.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24, // 1 day
  });
  
  return res;
}
