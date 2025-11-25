import { NextResponse } from 'next/server';
import { verificationCodes } from '@/lib/verification';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { message: 'Email và mã xác thực là bắt buộc' },
        { status: 400 }
      );
    }

    // Get stored code
    const stored = verificationCodes.get(email);

    if (!stored) {
      return NextResponse.json(
        { message: 'Không tìm thấy mã xác thực. Vui lòng yêu cầu mã mới.' },
        { status: 404 }
      );
    }

    // Check if code is expired
    if (Date.now() > stored.expires) {
      verificationCodes.delete(email);
      return NextResponse.json(
        { message: 'Mã xác thực đã hết hạn. Vui lòng yêu cầu mã mới.' },
        { status: 400 }
      );
    }

    // Check if code matches
    if (stored.code !== code) {
      return NextResponse.json(
        { message: 'Mã xác thực không đúng' },
        { status: 400 }
      );
    }

    // Code is valid - don't delete yet, will delete after password reset
    return NextResponse.json({
      message: 'Mã xác thực hợp lệ',
      verified: true,
    });
  } catch (error) {
    console.error('Verify code error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
