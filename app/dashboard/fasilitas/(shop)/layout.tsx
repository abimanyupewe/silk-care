import { redirect } from 'next/navigation';
import { getActiveSession } from '@/lib/auth-guard';
import { isShopFacility } from '@/lib/facility-types';

// Pesanan dan produk hanya untuk apotek; tipe lain kembali ke Ringkasan.
export default async function ShopLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getActiveSession();

  if (!isShopFacility(session?.user.role)) {
    redirect('/dashboard/fasilitas');
  }

  return children;
}
