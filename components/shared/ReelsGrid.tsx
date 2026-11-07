'use client';

import { Clapperboard, Play, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export type ReelItem = {
  id: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  caption: string | null;
  createdAt: Date | string;
};

const dateFormat = new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' });

export function ReelsGrid({ reels, name }: { reels: ReelItem[]; name: string }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const current = reels.find((reel) => reel.id === openId);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (current && !dialog.open) dialog.showModal();
    if (!current && dialog.open) dialog.close();
  }, [current]);

  const close = () => {
    setOpenId(null);
    opener.current?.focus();
  };

  if (reels.length === 0) {
    return (
      <div className="mt-6 flex flex-col items-center gap-2 border border-border bg-surface px-4 py-12 text-center">
        <Clapperboard className="h-8 w-8 text-ink-muted" aria-hidden="true" />
        <p className="font-semibold text-ink">Belum ada reels</p>
        <p className="text-sm text-ink-muted">{name} belum membagikan video.</p>
      </div>
    );
  }

  return (
    <>
      <ul className="mt-6 grid grid-cols-3 gap-1">
        {reels.map((reel) => (
          <li key={reel.id}>
            <button
              type="button"
              onClick={(event) => {
                opener.current = event.currentTarget;
                setOpenId(reel.id);
              }}
              aria-label={`Buka reels: ${reel.caption ?? name}`}
              className="relative block aspect-square w-full overflow-hidden border border-border bg-ink"
            >
              {reel.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- URL eksternal bebas
                <img src={reel.thumbnailUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                // #t=0.1 menampilkan frame pertama sebagai sampul tanpa memutar video.
                <video
                  src={`${reel.videoUrl}#t=0.1`}
                  preload="metadata"
                  muted
                  playsInline
                  className="h-full w-full object-cover"
                />
              )}
              <span className="absolute right-1 top-1 bg-ink p-1 text-white">
                <Play className="h-4 w-4" aria-hidden="true" />
              </span>
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        onClose={() => setOpenId(null)}
        onClick={(event) => event.target === dialogRef.current && close()}
        aria-label={`Reels ${name}`}
        className="m-auto w-[min(92vw,56rem)] border border-border-strong bg-white p-0 backdrop:bg-black/70"
      >
        {current ? (
          <div className="grid max-h-[90vh] md:grid-cols-[1fr_320px]">
            <video
              key={current.id}
              src={current.videoUrl}
              controls
              autoPlay
              playsInline
              className="max-h-[60vh] w-full bg-ink md:max-h-[90vh]"
            />
            <div className="flex min-h-0 flex-col border-t border-border md:border-l md:border-t-0">
              <div className="flex items-center justify-between gap-2 border-b border-border p-3">
                <p className="font-semibold text-ink">{name}</p>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Tutup"
                  className="flex h-11 w-11 items-center justify-center text-ink hover:bg-surface"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <div className="overflow-y-auto p-4">
                {current.caption ? (
                  <p className="whitespace-pre-line leading-7 text-ink">
                    <span className="font-semibold">{name}</span> {current.caption}
                  </p>
                ) : null}
                <p className="mt-3 text-sm text-ink-muted">
                  {dateFormat.format(new Date(current.createdAt))}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
