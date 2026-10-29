import { useCallback } from 'react';
import useSWR from 'swr';
import { AdminApiError, fetchAdmin, type AdminPaginationMeta } from '@/lib/admin-api';

// Data admin dibaca lewat SWR: cache per URL, polling saat tab terlihat, dan revalidasi saat
// fokus kembali. Revalidasi gagal tidak menghapus data lama; error hanya tampil bila belum ada data.
export function useAdminQuery<T>(path: string | null, refreshInterval = 15000) {
  const { data, error, isLoading, mutate } = useSWR(
    path,
    async (key: string) => {
      try {
        return await fetchAdmin<T>(key);
      } catch (cause) {
        if (cause instanceof AdminApiError && cause.status === 401) {
          window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
        }

        throw cause;
      }
    },
    { refreshInterval, shouldRetryOnError: false }
  );

  const reload = useCallback(() => void mutate(), [mutate]);

  return {
    data: data?.data,
    meta: data?.meta as AdminPaginationMeta | undefined,
    loading: isLoading,
    error: !data && error instanceof Error ? error.message : '',
    reload
  };
}
