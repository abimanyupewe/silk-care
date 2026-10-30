'use client';

import { useEffect } from 'react';
import { CircleHelp } from 'lucide-react';
import { driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';

function isVisible(selector: string) {
  const el = document.querySelector<HTMLElement>(selector);
  return !!el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
}

function buildSteps(): DriveStep[] {
  const steps: DriveStep[] = [
    {
      popover: {
        title: 'Selamat datang di SILK',
        description: 'Kami tunjukkan bagian-bagian utama panel ini dalam beberapa langkah singkat.'
      }
    },
    {
      element: '#panel-nav',
      popover: {
        title: 'Menu navigasi',
        description:
          'Pindah antarhalaman panel lewat menu ini. Angka kuning menandai antrean yang menunggu.'
      }
    },
    {
      element: '#panel-breadcrumb',
      popover: {
        title: 'Lokasi Anda',
        description: 'Menunjukkan halaman yang sedang dibuka.'
      }
    },
    {
      element: '#panel-main',
      popover: {
        title: 'Area kerja',
        description: 'Data dan formulir dari halaman yang dipilih tampil di sini.'
      }
    },
    {
      element: '#panel-signout',
      popover: {
        title: 'Keluar',
        description:
          'Akhiri sesi di perangkat ini. Panduan ini bisa dibuka lagi lewat tombol Panduan.'
      }
    }
  ];

  // Sidebar tersembunyi di mobile saat menu tertutup; jangan menyorot elemen yang tak terlihat.
  return steps.filter((step) => !step.element || isVisible(step.element as string));
}

function startPanelTour(doneKey: string) {
  driver({
    showProgress: true,
    nextBtnText: 'Lanjut',
    prevBtnText: 'Kembali',
    doneBtnText: 'Selesai',
    progressText: '{{current}} dari {{total}}',
    steps: buildSteps(),
    onDestroyed: () => {
      try {
        localStorage.setItem(doneKey, '1');
      } catch {
        // Hanya penanda tampilan; aman diabaikan.
      }
    }
  }).drive();
}

export function PanelTour({ storageKey }: { storageKey: string }) {
  const doneKey = `${storageKey}:tour`;

  useEffect(() => {
    try {
      if (localStorage.getItem(doneKey) === '1') return;
    } catch {
      return;
    }
    startPanelTour(doneKey);
  }, [doneKey]);

  return (
    <button
      type="button"
      onClick={() => startPanelTour(doneKey)}
      className="inline-flex min-h-11 shrink-0 items-center gap-2 border border-border-strong px-3 text-sm font-medium hover:bg-primary-tint"
    >
      <CircleHelp className="h-5 w-5" aria-hidden="true" />
      <span>Panduan</span>
    </button>
  );
}
