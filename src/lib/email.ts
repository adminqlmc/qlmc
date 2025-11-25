import nodemailer from 'nodemailer';

// Basic transporter using environment variables. In production, configure secure service.
// Required env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM

let testAccount: any = null;

async function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  
  // Development fallback: use ethereal test account
  if (!host || !user || !pass) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[EMAIL] SMTP not configured - creating Ethereal test account...');
      
      // Create test account once and reuse
      if (!testAccount) {
        testAccount = await nodemailer.createTestAccount();
        console.log('[EMAIL] ✅ Ethereal account created:');
        console.log(`   User: ${testAccount.user}`);
        console.log(`   Pass: ${testAccount.pass}`);
        console.log(`   Preview: https://ethereal.email/messages`);
      }
      
      return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }
    throw new Error('Thiếu cấu hình SMTP (HOST/USER/PASS).');
  }
  
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendVerificationEmail(to: string, code: string) {
  const transporter = await createTransport();
  const from = process.env.EMAIL_FROM || 'QLMC <no-reply@qlmc.edu.vn>';
  const html = `
    <div style="font-family:Arial,sans-serif;font-size:14px;color:#333">
      <h2>Yêu cầu đặt lại mật khẩu</h2>
      <p>Mã xác thực của bạn là:</p>
      <p style="font-size:24px;font-weight:bold;letter-spacing:4px">${code}</p>
      <p>Mã sẽ hết hạn sau 60 giây. Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.</p>
    </div>
  `;
  
  const info = await transporter.sendMail({
    from,
    to,
    subject: 'Mã xác thực đặt lại mật khẩu - QLMC',
    html,
  });
  
  // Development mode: show preview URL
  if (process.env.NODE_ENV === 'development' && testAccount) {
    console.log('[EMAIL] ✅ Email sent to:', to);
    console.log('[EMAIL] 📧 Preview URL:', nodemailer.getTestMessageUrl(info));
  }
}
