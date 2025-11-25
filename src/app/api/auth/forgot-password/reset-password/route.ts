import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/bcrypt';
import { verificationCodes } from '@/lib/verification';
import { validateStrongPassword } from '@/lib/passwordPolicy';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, code, newPassword } = body;

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { message: 'Email, mã xác thực và mật khẩu mới là bắt buộc' },
        { status: 400 }
      );
    }

    const policy = validateStrongPassword(newPassword);
    if (!policy.ok) {
      return NextResponse.json({ message: policy.message }, { status: 400 });
    }

    // Verify code again
    const stored = verificationCodes.get(email);

    if (!stored) {
      return NextResponse.json(
        { message: 'Không tìm thấy mã xác thực. Vui lòng yêu cầu mã mới.' },
        { status: 404 }
      );
    }

    if (Date.now() > stored.expires) {
      verificationCodes.delete(email);
      return NextResponse.json(
        { message: 'Mã xác thực đã hết hạn. Vui lòng yêu cầu mã mới.' },
        { status: 400 }
      );
    }

    if (stored.code !== code) {
      return NextResponse.json(
        { message: 'Mã xác thực không đúng' },
        { status: 400 }
      );
    }

    // Find user by email (check both regular and Google email)
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { googleEmail: email },
        ],
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Không tìm thấy người dùng' },
        { status: 404 }
      );
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Delete verification code
    verificationCodes.delete(email);

    return NextResponse.json({
      message: 'Đặt lại mật khẩu thành công',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
