import Link from 'next/link';
import { Info, Sparkles, TriangleAlert, X, type LucideIcon } from 'lucide-react';
import { announcementToneLabels, type AnnouncementToneValue } from '@/lib/announcement';

type AnnouncementBarProps = {
  announcement: {
    message: string;
    linkLabel: string | null;
    linkUrl: string | null;
    tone: AnnouncementToneValue;
    dismissible: boolean;
  };
  onDismiss?: () => void;
};

// Makna nada tidak hanya lewat warna: ada ikon dan label untuk pembaca layar.
const toneStyles: Record<AnnouncementToneValue, { bar: string; icon: LucideIcon }> = {
  INFO: { bar: 'bg-primary-tint text-primary-deep', icon: Info },
  PROMO: { bar: 'bg-amber-tint text-amber-ink', icon: Sparkles },
  IMPORTANT: { bar: 'bg-destructive text-white', icon: TriangleAlert }
};

const linkClass =
  'inline-flex min-h-11 items-center whitespace-nowrap font-semibold underline underline-offset-2';

// Presentasi murni (tanpa data fetch): dipakai banner publik dan pratinjau di panel admin.
export function AnnouncementBar({ announcement, onDismiss }: AnnouncementBarProps) {
  const { bar, icon: Icon } = toneStyles[announcement.tone];
  const canDismiss = announcement.dismissible && onDismiss;
  const { linkLabel, linkUrl } = announcement;

  return (
    <div role="status" className={`relative w-full ${bar}`}>
      <div
        className={`container mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 px-4 text-center text-sm ${
          canDismiss ? 'pr-14' : ''
        }`}
      >
        <span className="flex items-center gap-2 py-2">
          <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            <span className="sr-only">{announcementToneLabels[announcement.tone]}: </span>
            {announcement.message}
          </span>
        </span>
        {linkLabel && linkUrl ? (
          linkUrl.startsWith('/') ? (
            <Link href={linkUrl} className={linkClass}>
              {linkLabel}
            </Link>
          ) : (
            <a href={linkUrl} rel="noopener noreferrer" className={linkClass}>
              {linkLabel}
            </a>
          )
        ) : null}
      </div>
      {canDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Tutup pengumuman"
          className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md hover:opacity-70"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
