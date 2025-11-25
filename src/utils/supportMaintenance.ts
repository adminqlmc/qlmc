import { prisma } from '@/lib/prisma';

/**
 * Start scheduled maintenance for projectors if the scheduled start time has arrived.
 * Only affects support requests in_progress with a linked projector and scheduledStartTime <= now.
 * Will not auto-revert status; technician/admin must change it later.
 * Returns number of projectors updated.
 */
export async function startScheduledProjectorMaintenanceIfDue(): Promise<number> {
  const now = new Date();

  // Find all due support requests with projector assigned
  const due = await prisma.supportRequest.findMany({
    where: {
      status: 'in_progress',
      projectorId: { not: null },
      scheduledStartTime: { lte: now },
    },
    select: { projectorId: true },
  });

  const projectorIds = Array.from(new Set(due.map(d => d.projectorId!).filter(Boolean)));
  if (projectorIds.length === 0) return 0;

  // Update projectors that are not already in maintenance
  const result = await prisma.projector.updateMany({
    where: {
      id: { in: projectorIds },
      status: { not: 'maintenance' },
    },
    data: {
      status: 'maintenance',
      lastMaintenanceDate: now,
    },
  });

  return result.count;
}
