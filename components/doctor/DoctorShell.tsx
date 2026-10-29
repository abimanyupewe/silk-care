'use client';

import { LayoutDashboard } from 'lucide-react';
import { PanelShell, type NavGroup } from '@/components/panel/PanelShell';

const navGroups: NavGroup[] = [
  {
    items: [{ href: '/dashboard/dokter', label: 'Ringkasan', icon: LayoutDashboard }]
  }
];

export function DoctorShell({
  user,
  children
}: {
  user: { name?: string | null; email?: string | null };
  children: React.ReactNode;
}) {
  return (
    <PanelShell
      navGroups={navGroups}
      brand={{ name: 'SILK', subtitle: 'Panel dokter' }}
      rootHref="/dashboard/dokter"
      navLabel="Navigasi dokter"
      storageKey="silk-doctor-sidebar-collapsed"
      user={user}
    >
      {children}
    </PanelShell>
  );
}
