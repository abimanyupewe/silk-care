'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Building2,
  FileText,
  Pill,
  Search,
  Stethoscope,
  X,
  type LucideIcon
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { searchItems, type SearchItem, type SearchItemType } from '@/lib/search-index';

const groupOrder: SearchItemType[] = ['doctor', 'service', 'product', 'article'];

const groupLabels: Record<SearchItemType, string> = {
  doctor: 'Dokter',
  service: 'Layanan',
  product: 'Apotek',
  article: 'Artikel'
};

const groupIcons: Record<SearchItemType, LucideIcon> = {
  doctor: Stethoscope,
  service: Building2,
  product: Pill,
  article: FileText
};

const popularQueries = ['Spesialis anak', 'Vitamin', 'Klinik', 'Kesehatan mental'];

export const SearchModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const results = useMemo(() => searchItems(query), [query]);

  const groups = useMemo(
    () =>
      groupOrder
        .map((type) => ({
          type,
          items: results.filter((item) => item.type === type).slice(0, 4)
        }))
        .filter((group) => group.items.length > 0),
    [results]
  );

  const flatResults = useMemo(() => groups.flatMap((group) => group.items), [groups]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) dialog.showModal();
      setQuery('');
      setActiveIndex(0);
      const frame = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(frame);
    }

    if (dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => onClose();
    dialog.addEventListener('close', handleClose);

    return () => dialog.removeEventListener('close', handleClose);
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const openResultsPage = () => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;

    onClose();
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const handleSelect = (item: SearchItem) => {
    onClose();
    router.push(item.href);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (flatResults.length > 0) {
        setActiveIndex((index) => (index + 1) % flatResults.length);
      }
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (flatResults.length > 0) {
        setActiveIndex((index) => (index - 1 + flatResults.length) % flatResults.length);
      }
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const item = flatResults[activeIndex];
      if (item) {
        handleSelect(item);
      } else {
        openResultsPage();
      }
    }
  };

  const handleDialogClick = (event: React.MouseEvent<HTMLDialogElement>) => {
    if (event.target === dialogRef.current) {
      dialogRef.current?.close();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleDialogClick}
      className="m-0 h-full max-h-none w-full max-w-none border-0 bg-transparent p-0 backdrop:bg-[rgb(17_17_20_/_45%)]"
    >
      <div className="mx-auto flex h-full w-full flex-col overflow-hidden border-border bg-white sm:mt-[12vh] sm:h-auto sm:max-h-[70vh] sm:w-[min(720px,calc(100%-2rem))] sm:rounded-lg sm:border">
        <div className="flex items-center gap-3 border-b border-border px-4 sm:px-5">
          <Search className="h-5 w-5 shrink-0 text-ink-muted" aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Cari dokter, klinik, atau obat..."
            aria-label="Cari dokter, klinik, atau obat"
            className="h-14 min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-faint sm:h-16 sm:text-lg"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-ink-muted hover:bg-surface hover:text-ink"
              aria-label="Hapus pencarian"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-border text-ink-muted hover:border-border-strong hover:text-ink"
            aria-label="Tutup pencarian"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {query.trim().length < 2 ? (
            <div className="px-3 py-4">
              <p className="px-2 text-sm font-semibold text-ink-muted">Pencarian populer</p>
              <div className="mt-3 flex flex-wrap gap-2 px-2">
                {popularQueries.map((popular) => (
                  <button
                    key={popular}
                    type="button"
                    onClick={() => {
                      setQuery(popular);
                      inputRef.current?.focus();
                    }}
                    className="h-10 rounded-md border border-border-strong px-3 text-sm font-medium text-ink hover:border-primary hover:bg-primary-tint"
                  >
                    {popular}
                  </button>
                ))}
              </div>
            </div>
          ) : flatResults.length > 0 ? (
            <>
              {groups.map((group) => {
                const Icon = groupIcons[group.type];

                return (
                  <div key={group.type} className="px-2 pb-2">
                    <p className="px-3 pb-1 pt-3 text-sm font-semibold text-ink-muted">
                      {groupLabels[group.type]}
                    </p>
                    {group.items.map((item) => {
                      const index = flatResults.indexOf(item);
                      const active = index === activeIndex;

                      return (
                        <Link
                          key={`${item.type}-${item.title}`}
                          href={item.href}
                          onClick={onClose}
                          onMouseEnter={() => setActiveIndex(index)}
                          className={`flex min-h-14 items-start gap-3 rounded-md px-3 py-3 ${
                            active ? 'bg-primary-tint' : 'hover:bg-surface'
                          }`}
                        >
                          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface text-primary">
                            <Icon className="h-4 w-4" aria-hidden="true" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold text-ink">
                              {item.title}
                            </span>
                            <span className="mt-0.5 block text-sm text-ink-muted">
                              {item.subtitle}
                            </span>
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                );
              })}

              <button
                type="button"
                onClick={openResultsPage}
                className="flex w-full items-center justify-between border-t border-border px-5 py-4 text-sm font-semibold text-primary-hover hover:bg-surface"
              >
                Lihat semua hasil untuk &quot;{query.trim()}&quot;
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </>
          ) : (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-semibold text-ink">
                Tidak ada hasil untuk &quot;{query.trim()}&quot;.
              </p>
              <p className="mt-2 text-sm text-ink-muted">
                Coba kata kunci lain seperti nama dokter, spesialis, atau produk.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-ink-muted">
          <span>↑↓ pilih · Enter buka</span>
          <span>Esc tutup</span>
        </div>
      </div>
    </dialog>
  );
};
