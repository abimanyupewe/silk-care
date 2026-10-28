import { auth } from '@/auth';
import { jsonError, jsonOk } from '@/lib/api';

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return jsonError('Belum login.', 401);
  }

  return jsonOk(session.user);
}
