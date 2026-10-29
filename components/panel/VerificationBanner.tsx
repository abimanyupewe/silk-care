import { CheckCircle2, Clock3, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const states = {
  PENDING: {
    icon: Clock3,
    label: 'Menunggu verifikasi',
    detail:
      'Admin sedang meninjau data Anda. Sampai terverifikasi, profil belum tampil di katalog publik.',
    tone: 'border-amber bg-amber-tint text-amber-ink'
  },
  VERIFIED: {
    icon: CheckCircle2,
    label: 'Terverifikasi',
    detail: 'Profil Anda tampil di katalog publik.',
    tone: 'border-primary bg-primary-tint text-primary-hover'
  },
  REJECTED: {
    icon: XCircle,
    label: 'Verifikasi ditolak',
    detail: 'Perbarui data profil Anda, lalu hubungi admin untuk ditinjau ulang.',
    tone: 'border-destructive bg-white text-destructive'
  }
} as const;

export function VerificationBanner({ status }: { status: string }) {
  const state = states[status as keyof typeof states] ?? states.PENDING;
  const Icon = state.icon;

  return (
    <div role="status" className={cn('flex items-start gap-3 border p-4', state.tone)}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div>
        <p className="text-sm font-semibold">{state.label}</p>
        <p className="mt-1 text-sm">{state.detail}</p>
      </div>
    </div>
  );
}
