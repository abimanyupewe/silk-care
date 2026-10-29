'use client';

import { LayoutDashboard, Package, ShoppingBag } from 'lucide-react';
import { PanelShell, type NavGroup } from '@/components/panel/PanelShell';

const navGroups: NavGroup[] = [
  {
    items: [
      { href: '/dashboard/fasilitas', label: 'Ringkasan', icon: LayoutDashboard },
      { href: '/dashboard/fasilitas/pesanan', label: 'Pesanan', icon: ShoppingBag },
      { href: '/dashboard/fasilitas/produk', label: 'Produk', icon: Package }
    ]
  }
];

export function FacilityShell({
  user,
  children
}: {
  user: { name?: string | null; email?: string | null };
  children: React.ReactNode;
}) {
  return (
    <PanelShell
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
