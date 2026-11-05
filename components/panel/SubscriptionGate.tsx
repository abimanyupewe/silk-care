'use client';

import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useApiQuery } from '@/lib/api-swr';
import type { SubscriptionSnapshot } from './LanggananPanel';
import { SubscriptionTrialNotice } from './SubscriptionTrialNotice';

// Gerbang langganan panel mitra: langganan yang habis memaksa ke halaman Langganan, kecuali
// memang sudah di sana (di situlah cara perpanjangan). Gagal membaca status dibiarkan masuk
// supaya kendala jaringan tidak mengunci demo.
export function SubscriptionGate({
  langgananHref,
  children
}: {
  langgananHref: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data } = useApiQuery<SubscriptionSnapshot>('/subscription', 60000);
  const expired = data?.status === 'EXPIRED';

  useEffect(() => {
    if (expired && pathname !== langgananHref) {
      router.replace(langgananHref);
    }
  }, [expired, langgananHref, pathname, router]);

  return (
    <>
      {pathname !== langgananHref ? (
        <SubscriptionTrialNotice subscription={data} langgananHref={langgananHref} />
      ) : null}
      {children}
    </>
  );
}
