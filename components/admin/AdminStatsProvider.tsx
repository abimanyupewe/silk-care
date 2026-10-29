'use client';

import { createContext, useContext, useMemo } from 'react';
import { useAdminQuery } from '@/lib/admin-swr';
import type { AdminStats } from '@/lib/admin-api';

type AdminStatsState = {
  stats: AdminStats | null;
  loading: boolean;
  error: string;
  reload: () => void;
};

const AdminStatsContext = createContext<AdminStatsState | null>(null);

export function AdminStatsProvider({ children }: { children: React.ReactNode }) {
  const { data, loading, error, reload } = useAdminQuery<AdminStats>('/admin/stats', 30000);
  const value = useMemo(
    () => ({ stats: data ?? null, loading, error, reload }),
    [data, loading, error, reload]
  );

  return <AdminStatsContext.Provider value={value}>{children}</AdminStatsContext.Provider>;
}

export function useAdminStats() {
  const context = useContext(AdminStatsContext);

  if (!context) {
    throw new Error('useAdminStats harus dipakai di dalam AdminStatsProvider.');
  }

  return context;
}
