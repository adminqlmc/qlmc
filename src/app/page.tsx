import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getJwtPayload } from '@/lib/jwt';

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (token) {
    const payload = await getJwtPayload(token);
    if (payload && typeof payload === 'object') {
      if (payload.role === 'admin') redirect('/admin');
      if (payload.role === 'teacher') redirect('/teacher');
      if (payload.role === 'technician') redirect('/technician');
    }
  }

  redirect('/login');
}
