'use client';

import {
  Activity,
  Building2,
  CalendarClock,
  FileText,
  LayoutDashboard,
  Mail,
  Megaphone,
  MessageSquareText,
  ScrollText,
  ShoppingBag,
  Stethoscope,
  Users
} from 'lucide-react';
import { AdminStatsProvider, useAdminStats } from '@/components/admin/AdminStatsProvider';
import { PanelShell, type NavGroup, type NavItem } from '@/components/panel/PanelShell';
import type { AdminStats } from '@/lib/admin-api';

const navGroups: Array<
  NavGroup & {
    items: Array<NavItem & { pending?: (moderation: AdminStats['moderation']) => number }>;
  }
> = [
  {
    items: [{ href: '/admin', label: 'Dashboard', icon: LayoutDashboard }]
  },
  {
    label: 'Operasional',
    items: [
      { href: '/admin/users', label: 'Pengguna', icon: Users },
      { href: '/admin/orders', label: 'Pesanan', icon: ShoppingBag },
      { href: '/admin/consultations', label: 'Konsultasi', icon: CalendarClock }
    ]
  },
  {
    label: 'Verifikasi & moderasi',
    items: [
      {
        href: '/admin/doctors',
        label: 'Dokter',
        icon: Stethoscope,
        pending: (moderation) => moderation.pendingDoctors
      },
      {
        href: '/admin/facilities',
        label: 'Fasilitas',
        icon: Building2,
        pending: (moderation) => moderation.pendingFacilities
      },
      {
        href: '/admin/reviews',
        label: 'Ulasan',
        icon: MessageSquareText,
        pending: (moderation) => moderation.pendingReviews
      },
      {
        href: '/admin/articles',
        label: 'Artikel',
        icon: FileText,
        pending: (moderation) => moderation.pendingArticles
      }
    ]
  },
  {
    label: 'Sistem',
    items: [
      { href: '/admin/broadcast', label: 'Broadcast', icon: Megaphone },
      { href: '/admin/audit-logs', label: 'Audit log', icon: ScrollText },
      { href: '/admin/email-templates', label: 'Template email', icon: Mail },
      { href: '/admin/system', label: 'Status sistem', icon: Activity }
    ]
  }
];

type AdminShellProps = {
  user: {
    name?: string | null;
    email?: string | null;
  };
  children: React.ReactNode;
};

export function AdminShell(props: AdminShellProps) {
  return (
    <AdminStatsProvider>
      <AdminShellContent {...props} />
    </AdminStatsProvider>
  );
}

function AdminShellContent({ user, children }: AdminShellProps) {
  const { stats } = useAdminStats();
  // Angka antrean hanya pelengkap; sidebar tetap tampil tanpa angka.
  const moderation = stats?.moderation ?? null;
  const badges = Object.fromEntries(
    navGroups
      .flatMap((group) => group.items)
      .map((item) => [item.href, moderation && item.pending ? item.pending(moderation) : 0])
  );

  return (
    <PanelShell
      navGroups={navGroups}
      brand={{ name: 'SILK', subtitle: 'Panel admin' }}
      rootHref="/admin"
      navLabel="Navigasi admin"
      storageKey="silk-admin-sidebar-collapsed"
      user={user}
      badges={badges}
    >
      {children}
    </PanelShell>
  );
}
