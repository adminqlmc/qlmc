// Temporary in-memory storage for verification codes
// In production, use Redis or a database table with TTL
export const verificationCodes = new Map<string, { code: string; expires: number }>();

// Generate 6-digit code
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Clean up expired codes periodically
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of verificationCodes.entries()) {
    if (now > data.expires) {
      verificationCodes.delete(email);
    }
  }
}, 60000); // Clean every minute
