'use client';

import { useEffect } from 'react';
import { INSTALL_AVAILABLE_EVENT, type InstallPromptWindow } from './InstallAppButton';

// Selalu terpasang di root layout: event beforeinstallprompt hanya muncul sekali per muat halaman,
// jadi ditangkap di sini agar tombol install di panel tetap bisa memakainya setelah navigasi.
export function ServiceWorkerRegister() {
  useEffect(() => {
    const win = window as InstallPromptWindow;
    const onPrompt = (event: Event) => {
      event.preventDefault();
      win.silkInstallPrompt = event as InstallPromptWindow['silkInstallPrompt'];
      window.dispatchEvent(new Event(INSTALL_AVAILABLE_EVENT));
    };
    const onInstalled = () => {
      win.silkInstallPrompt = undefined;
      window.dispatchEvent(new Event(INSTALL_AVAILABLE_EVENT));
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);

    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  return null;
}
