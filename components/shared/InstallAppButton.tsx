'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { cn } from '@/lib/utils';

export const INSTALL_AVAILABLE_EVENT = 'silk-install-available';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export type InstallPromptWindow = Window & { silkInstallPrompt?: BeforeInstallPromptEvent };

type Mode = 'hidden' | 'prompt' | 'ios';

function detectMode(): Mode {
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (standalone) return 'hidden';
  if ((window as InstallPromptWindow).silkInstallPrompt) return 'prompt';
  // iOS tidak punya beforeinstallprompt; pasang hanya lewat menu Share Safari.
  if (/iphone|ipad|ipod/i.test(navigator.userAgent)) return 'ios';
  return 'hidden';
}

export function InstallAppButton({
  className,
  collapsed
}: {
  className?: string;
  collapsed?: boolean;
}) {
  const [mode, setMode] = useState<Mode>('hidden');
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    const update = () => setMode(detectMode());
    update();
    window.addEventListener(INSTALL_AVAILABLE_EVENT, update);
    return () => window.removeEventListener(INSTALL_AVAILABLE_EVENT, update);
  }, []);

  if (mode === 'hidden') return null;

  const install = async () => {
    if (mode === 'ios') {
      setShowIosHint((value) => !value);
      return;
    }
    const win = window as InstallPromptWindow;
    const event = win.silkInstallPrompt;
    if (!event) return;
    await event.prompt();
    await event.userChoice;
    // Event prompt hanya bisa dipakai sekali.
    win.silkInstallPrompt = undefined;
    setMode(detectMode());
  };

  return (
    <>
      <button
        type="button"
        onClick={install}
        title={collapsed ? 'Install aplikasi' : undefined}
        aria-expanded={mode === 'ios' ? showIosHint : undefined}
        className={className}
      >
        <Download className="h-5 w-5 shrink-0" aria-hidden="true" />
        <span className={cn(collapsed && 'md:sr-only')}>Install aplikasi</span>
      </button>
      {mode === 'ios' && showIosHint ? (
        <p className={cn('px-3 py-2 text-sm', collapsed && 'md:hidden')}>
          Di Safari, ketuk tombol Bagikan lalu pilih &quot;Tambah ke Layar Utama&quot;.
        </p>
      ) : null}
    </>
  );
}
