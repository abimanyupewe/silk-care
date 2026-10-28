'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AdminApiError, fetchAdmin, type AdminStats } from '@/lib/admin-api';

type AdminStatsState = {
  stats: AdminStats | null;
  loading: boolean;
  error: string;
  reload: () => void;
};

const AdminStatsContext = createContext<AdminStatsState | null>(null);

export function AdminStatsProvider({ children }: { children: React.ReactNode }) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError('');

    fetchAdmin<AdminStats>('/admin/stats', { signal: controller.signal })
      .then((response) => {
        setStats(response.data);
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === 'AbortError') {
          return;
        }

        if (cause instanceof AdminApiError && cause.status === 401) {
          window.location.href = '/login?callbackUrl=/admin';
          return;
        }

        setError(cause instanceof Error ? cause.message : 'Gagal memuat ringkasan admin.');
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [attempt]);

  const reload = useCallback(() => setAttempt((value) => value + 1), []);
  const value = useMemo(() => ({ stats, loading, error, reload }), [stats, loading, error, reload]);

  return <AdminStatsContext.Provider value={value}>{children}</AdminStatsContext.Provider>;
}

export function useAdminStats() {
  const context = useContext(AdminStatsContext);

  if (!context) {
    throw new Error('useAdminStats harus dipakai di dalam AdminStatsProvider.');
  }

  return context;
}
