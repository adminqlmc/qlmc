// Force all API routes to use dynamic rendering
// This prevents Prisma connection errors during build time
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function ApiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
