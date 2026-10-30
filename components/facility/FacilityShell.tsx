'use client';

import { Bell, Building2, Clock, LayoutDashboard, Package, ShoppingBag, Star } from 'lucide-react';
import { PanelShell, type NavGroup } from '@/components/panel/PanelShell';
import { useApiQuery } from '@/lib/api-swr';
import { isShopFacility } from '@/lib/facility-types';

const shopItems = [
  { href: '/dashboard/fasilitas/pesanan', label: 'Pesanan', icon: ShoppingBag },
  { href: '/dashboard/fasilitas/produk', label: 'Produk', icon: Package }
];

const commonItems = [
  { href: '/dashboard/fasilitas/ulasan', label: 'Ulasan', icon: Star },
  { href: '/dashboard/fasilitas/notifikasi', label: 'Notifikasi', icon: Bell },
  { href: '/dashboard/fasilitas/profil', label: 'Profil', icon: Building2 },
  { href: '/dashboard/fasilitas/jam-operasional', label: 'Jam operasional', icon: Clock }
];

export function FacilityShell({
  role,
  user,
  children
}: {
  role: string;
  user: { name?: string | null; email?: string | null };
  children: React.ReactNode;
}) {
  const shop = isShopFacility(role);
  const navGroups: NavGroup[] = [
    {
      items: [
        { href: '/dashboard/fasilitas', label: 'Ringkasan', icon: LayoutDashboard },
        ...(shop ? shopItems : []),
        ...commonItems
      ]
    }
  ];
  // URL sama dengan kartu di Ringkasan, jadi SWR memakai satu cache dan satu polling.
  // Path null = tidak fetch; route pesanan menolak non-apotek dengan 403.
  const paid = useApiQuery<unknown[]>(shop ? '/facility/orders?status=PAID&limit=1' : null, 30000);
  const notifications = useApiQuery<unknown[]>('/notifications?limit=1', 30000);
  const unread = (notifications.meta as { unreadCount?: number } | undefined)?.unreadCount ?? 0;

  return (
    <PanelShell
      badges={{
        '/dashboard/fasilitas/pesanan': paid.meta?.total ?? 0,
        '/dashboard/fasilitas/notifikasi': unread
      }}
      navGroups={navGroups}
      brand={{ name: 'SILK', subtitle: 'Panel fasilitas' }}
      rootHref="/dashboard/fasilitas"
      navLabel="Navigasi fasilitas"
      storageKey="silk-facility-sidebar-collapsed"
      user={user}
    >
      {children}
    </PanelShell>
  );
}
