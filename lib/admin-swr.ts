import { useCallback } from 'react';
import useSWR from 'swr';
import { fetchAdmin, type AdminPaginationMeta } from '@/lib/admin-api';

// Data admin dibaca lewat SWR: cache per URL, polling saat tab terlihat, dan revalidasi saat
// fokus kembali. Revalidasi gagal tidak menghapus data lama; error hanya tampil bila belum ada data.
export function useAdminQuery<T>(path: string | null, refreshInterval = 15000) {
  const { data, error, isLoading, mutate } = useSWR(path, (key: string) => fetchAdmin<T>(key), {
    refreshInterval,
    shouldRetryOnError: false
  });

  const reload = useCallback(() => void mutate(), [mutate]);

  return {
    data: data?.data,
    meta: data?.meta as AdminPaginationMeta | undefined,
    loading: isLoading,
    error: !data && error instanceof Error ? error.message : '',
    reload
  };
}
