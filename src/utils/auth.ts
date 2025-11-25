import { cookies } from 'next/headers';
import { getJwtPayload } from '@/lib/jwt';

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  return await getJwtPayload(token);
}

export async function requireRole(role: 'admin' | 'teacher' | 'technician') {
  const user = await getCurrentUser();
  if (!user || user.role !== role) {
    throw new Error('Unauthorized');
  }
}

export async function requireAnyRole(roles: Array<'admin' | 'teacher' | 'technician'>) {
  const user = await getCurrentUser();
  if (!user || !roles.includes(user.role)) {
    throw new Error('Unauthorized');
  }
}
