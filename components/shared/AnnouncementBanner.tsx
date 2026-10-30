'use client';

import { useState } from 'react';
import { useApiQuery } from '@/lib/api-swr';
import type { PublicAnnouncement } from '@/lib/announcement';
import { AnnouncementBar } from './AnnouncementBar';

const DISMISSED_KEY = 'silk-announcement-dismissed';

// Banner informasi di atas navbar. Gagal memuat = tanpa banner; halaman tidak terganggu.
export function AnnouncementBanner() {
  // Admin mengubah banner lewat panel; pengunjung cukup menyegarkan tiap 5 menit.
  const { data } = useApiQuery<PublicAnnouncement | null>('/announcements/active', 300000);
  // Dibaca saat inisialisasi, bukan di efek: banner yang sudah ditutup tidak sempat tampil sekilas
  // saat berpindah halaman. Aman untuk hidrasi karena data kosong di server dan render pertama.
  const [dismissedKey, setDismissedKey] = useState<string | null>(() => {
    try {
      return localStorage.getItem(DISMISSED_KEY);
    } catch {
      // Penyimpanan diblokir (atau di server): banner tetap tampil sampai ditutup di halaman ini.
      return null;
    }
  });

  if (!data) {
    return null;
  }

  // Kunci memuat updatedAt: banner yang diubah admin muncul lagi walau pernah ditutup.
  const key = `${data.id}:${data.updatedAt}`;

  if (dismissedKey === key) {
    return null;
  }

  const dismiss = () => {
    setDismissedKey(key);
    try {
      localStorage.setItem(DISMISSED_KEY, key);
    } catch {
      // Hanya preferensi tampilan; aman diabaikan.
    }
  };

  return <AnnouncementBar announcement={data} onDismiss={dismiss} />;
}
