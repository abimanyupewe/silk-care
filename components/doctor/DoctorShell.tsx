'use client';

import {
  Bell,
  CalendarClock,
  CreditCard,
  FileText,
  LayoutDashboard,
  Stethoscope,
  UserRound
} from 'lucide-react';
import { PanelShell, type NavGroup } from '@/components/panel/PanelShell';
import { SubscriptionGate } from '@/components/panel/SubscriptionGate';
import { useApiQuery } from '@/lib/api-swr';
import { transactionsEnabled } from '@/lib/features';

const langgananHref = '/dashboard/dokter/langganan';

const navGroups: NavGroup[] = [
  {
    items: [
      { href: '/dashboard/dokter', label: 'Ringkasan', icon: LayoutDashboard },
      ...(transactionsEnabled
        ? [{ href: '/dashboard/dokter/konsultasi', label: 'Konsultasi', icon: Stethoscope }]
        : []),
      { href: '/dashboard/dokter/artikel', label: 'Artikel', icon: FileText },
      { href: '/dashboard/dokter/notifikasi', label: 'Notifikasi', icon: Bell },
      { href: '/dashboard/dokter/profil', label: 'Profil', icon: UserRound },
      { href: '/dashboard/dokter/jadwal', label: 'Jadwal praktik', icon: CalendarClock },
      { href: langgananHref, label: 'Langganan', icon: CreditCard }
    ]
  }
];

export function DoctorShell({
  user,
  children
}: {
  user: { name?: string | null; email?: string | null };
  children: React.ReactNode;
}) {
  // URL sama dengan kartu di Ringkasan, jadi SWR memakai satu cache dan satu polling.
  const requested = useApiQuery<unknown[]>(
    transactionsEnabled ? '/doctor/consultations?status=REQUESTED&limit=1' : null,
    30000
  );

  const notifications = useApiQuery<unknown[]>('/notifications?limit=1', 30000);
  const unread = (notifications.meta as { unreadCount?: number } | undefined)?.unreadCount ?? 0;

  return (
    <PanelShell
      badges={{
        '/dashboard/dokter/konsultasi': requested.meta?.total ?? 0,
        '/dashboard/dokter/notifikasi': unread
      }}
      navGroups={navGroups}
      brand={{ name: 'SILK', subtitle: 'Panel dokter' }}
      rootHref="/dashboard/dokter"
      navLabel="Navigasi dokter"
      storageKey="silk-doctor-sidebar-collapsed"
      user={user}
    >
      <SubscriptionGate langgananHref={langgananHref}>{children}</SubscriptionGate>
    </PanelShell>
  );
}
