import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verificationCodes, generateVerificationCode } from '@/lib/verification';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user exists with this email (regular or Google email)
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
        { message: 'Email không tồn tại trong hệ thống' },
        { status: 404 }
      );
    }

    // Determine which email to send verification code to
    // Priority: googleEmail (if linked) > regular email
    const targetEmail = user.googleEmail || user.email;
    
    if (!targetEmail) {
      return NextResponse.json(
        { message: 'Tài khoản chưa có email. Vui lòng liên kết Google hoặc liên hệ admin.' },
        { status: 400 }
      );
    }

    // Generate verification code
    const code = generateVerificationCode();
    const expires = Date.now() + 60000; // 1 minute

    // Store code with the input email as key (for verification later)
    verificationCodes.set(email, { code, expires });

    // Send email to target email (Google email or regular email)
    try {
      await sendVerificationEmail(targetEmail, code);
    } catch (e) {
      console.error('Email send failed:', e);
      return NextResponse.json({ message: 'Không thể gửi email xác thực' }, { status: 500 });
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV] Verification code for ${email} sent to ${targetEmail}: ${code}`);
    }

    return NextResponse.json({ 
      message: `Mã xác thực đã được gửi đến ${targetEmail}`, 
      email,
      sentTo: targetEmail // Optional: inform user where code was sent
    });
  } catch (error) {
    console.error('Send code error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
