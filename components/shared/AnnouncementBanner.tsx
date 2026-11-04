'use client';

import { useEffect, useState } from 'react';
import { useApiQuery } from '@/lib/api-swr';
import type { PublicAnnouncement } from '@/lib/announcement';
import { AnnouncementBar } from './AnnouncementBar';

const DISMISSED_KEY = 'silk-announcement-dismissed-at';
// Cooldown penutupan: setelah ditutup, banner bersembunyi selama ini lalu muncul kembali
// dengan sendirinya (tanpa hitungan mundur yang ditampilkan ke pengunjung).
const COOLDOWN_MS = 5 * 60 * 1000;

type Dismissal = { key: string; at: number };

// Format tersimpan: "<id:updatedAt>|<timestamp penutupan>".
function readDismissal(): Dismissal | null {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);

    if (!raw) {
      return null;
    }

    const separator = raw.lastIndexOf('|');

    if (separator === -1) {
      return null;
    }

    const at = Number(raw.slice(separator + 1));

    return Number.isFinite(at) ? { key: raw.slice(0, separator), at } : null;
  } catch {
    // Penyimpanan diblokir (atau di server): banner tetap tampil.
    return null;
  }
}

// Banner informasi di atas navbar. Gagal memuat = tanpa banner; halaman tidak terganggu.
export function AnnouncementBanner() {
  // Admin mengubah banner lewat panel; pengunjung cukup menyegarkan tiap 5 menit.
  const { data } = useApiQuery<PublicAnnouncement | null>('/announcements/active', 300000);
  // Dibaca saat inisialisasi, bukan di efek: banner yang masih dalam cooldown tidak sempat
  // tampil sekilas saat berpindah halaman. Aman untuk hidrasi karena data kosong di server.
  const [dismissal, setDismissal] = useState<Dismissal | null>(() => readDismissal());

  // Cooldown berjalan: banner muncul kembali sendiri tanpa reload dan tanpa hitungan mundur.
  useEffect(() => {
    if (!data || !dismissal) {
      return;
    }

    const key = `${data.id}:${data.updatedAt}`;

    if (dismissal.key !== key) {
      return;
    }

    const remaining = COOLDOWN_MS - (Date.now() - dismissal.at);

    if (remaining <= 0) {
      setDismissal(null);
      return;
    }

    const timer = setTimeout(() => setDismissal(null), remaining);

    return () => clearTimeout(timer);
  }, [data, dismissal]);

  if (!data) {
    return null;
  }

  // Kunci memuat updatedAt: banner yang diubah admin muncul lagi walau sedang dalam cooldown.
  const key = `${data.id}:${data.updatedAt}`;
  const withinCooldown =
    dismissal !== null && dismissal.key === key && Date.now() - dismissal.at < COOLDOWN_MS;

  if (withinCooldown) {
    return null;
  }

  const dismiss = () => {
    const at = Date.now();

    setDismissal({ key, at });
    try {
      localStorage.setItem(DISMISSED_KEY, `${key}|${at}`);
    } catch {
      // Hanya preferensi tampilan; aman diabaikan.
    }
  };

  return <AnnouncementBar announcement={data} onDismiss={dismiss} />;
}
