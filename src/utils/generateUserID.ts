import { prisma } from '@/lib/prisma';

/**
 * Generate unique user ID with format QNUxxxxxxx
 * QNU = prefix for users
 * xxxxxxx = 7 random digits
 */
export async function generateUserID(): Promise<string> {
  const prefix = 'QNU';
  const maxAttempts = 10;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Generate 7 random digits
    const randomDigits = Math.floor(1000000 + Math.random() * 9000000).toString();
    const userID = `${prefix}${randomDigits}`;

    // Check if this ID already exists
    const existingUser = await prisma.user.findUnique({
      where: { userID },
    });

    if (!existingUser) {
      return userID;
    }
  }

  // Fallback: use timestamp if all attempts failed
  const timestamp = Date.now().toString().slice(-7);
  return `${prefix}${timestamp}`;
}
