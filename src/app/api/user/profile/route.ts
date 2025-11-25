import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/utils/auth';

export async function PUT(req: NextRequest) {
  try {
    // Get current user from token
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { fullName, avatar } = await req.json();

    // Update user profile (email cannot be changed - managed via Google link)
    const updatedUser = await prisma.user.update({
      where: { id: currentUser.userId },
      data: {
        fullName,
        avatar,
      },
      select: {
        id: true,
        userID: true,
        fullName: true,
        email: true,
        googleEmail: true,
        avatar: true,
        role: true,
      },
    });

    return NextResponse.json({
      message: 'Cập nhật thông tin thành công',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { message: 'Có lỗi xảy ra khi cập nhật thông tin' },
      { status: 500 }
    );
  }
}
