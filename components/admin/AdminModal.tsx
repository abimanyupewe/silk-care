'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

type AdminModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  // Saat true, Esc, klik latar, dan tombol tutup diabaikan (mis. request sedang berjalan).
  busy?: boolean;
  children: React.ReactNode;
};

export function AdminModal({ open, onClose, title, description, busy, children }: AdminModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;

    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="admin-modal-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current && !busy) onClose();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-lg border border-border bg-white p-0 text-ink backdrop:bg-ink/50"
    >
      {open ? (
        <div className="max-h-[calc(100vh-2rem)] overflow-y-auto p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="admin-modal-title" className="text-lg font-bold text-ink">
                {title}
              </h2>
              {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              aria-label="Tutup"
              className="-mr-2 -mt-2 inline-flex h-11 w-11 shrink-0 items-center justify-center hover:bg-surface disabled:opacity-50"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-4">{children}</div>
        </div>
      ) : null}
    </dialog>
  );
}

export function AdminConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  pendingLabel,
  pending,
  destructive = true,
  onConfirm,
  onCancel
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  pendingLabel: string;
  pending: boolean;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <AdminModal
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      busy={pending}
    >
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="inline-flex min-h-11 items-center justify-center border border-border-strong px-4 text-sm font-semibold text-ink hover:border-primary hover:bg-primary-tint disabled:cursor-not-allowed disabled:opacity-50"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={pending}
          aria-busy={pending}
          className={cn(
            'inline-flex min-h-11 items-center justify-center px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50',
            destructive
              ? 'bg-destructive hover:bg-destructive/90'
              : 'bg-primary hover:bg-primary-hover'
          )}
        >
          {pending ? pendingLabel : confirmLabel}
        </button>
      </div>
    </AdminModal>
  );
}
