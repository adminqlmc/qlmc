import { prisma } from '@/lib/prisma';

/**
 * Mark approved bookings as completed when endTime has passed.
 * Returns number of updated rows.
 */
export async function completeApprovedOverdue(): Promise<number> {
  const now = new Date();
  const result = await prisma.booking.updateMany({
    where: {
      status: 'approved',
      endTime: { lte: now },
    },
    data: { status: 'completed' },
  });
  return result.count;
}
