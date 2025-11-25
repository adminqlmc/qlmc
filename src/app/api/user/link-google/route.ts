import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/utils/auth';

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { googleEmail, googleId } = await req.json();

    if (!googleEmail || !googleId) {
      return NextResponse.json(
        { message: 'Thiếu thông tin Google' },
        { status: 400 }
      );
    }

    // Check if Google account already linked to another user
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { googleEmail },
          { googleId },
        ],
        NOT: {
          id: currentUser.userId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: 'Tài khoản Google này đã được liên kết với user khác' },
        { status: 400 }
      );
    }

    // Update user with Google info
    const updated = await prisma.user.update({
      where: { id: currentUser.userId },
      data: {
        googleEmail,
        googleId,
      },
      select: {
        id: true,
        userID: true,
        fullName: true,
        email: true,
        googleEmail: true,
        role: true,
      },
    });

    return NextResponse.json({
      message: 'Liên kết tài khoản Google thành công',
      user: updated,
    });
  } catch (error) {
    console.error('Link Google error:', error);
    return NextResponse.json(
      { message: 'Có lỗi xảy ra khi liên kết tài khoản' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Unlink Google account
    await prisma.user.update({
      where: { id: currentUser.userId },
      data: {
        googleEmail: null,
        googleId: null,
      },
    });

    return NextResponse.json({
      message: 'Hủy liên kết tài khoản Google thành công',
    });
  } catch (error) {
    console.error('Unlink Google error:', error);
    return NextResponse.json(
      { message: 'Có lỗi xảy ra' },
      { status: 500 }
    );
  }
}
