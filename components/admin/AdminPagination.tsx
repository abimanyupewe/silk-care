import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type AdminPaginationProps = {
  basePath: string;
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  query?: Record<string, string | undefined>;
};

export function AdminPagination({
  basePath,
  page,
  totalPages,
  total,
  limit,
  query = {}
}: AdminPaginationProps) {
  if (totalPages <= 1) {
    return (
      <p className="text-sm text-ink-muted">
        {total.toLocaleString('id-ID')} data · halaman {page} dari {Math.max(totalPages, 1)}
      </p>
    );
  }

  const hrefFor = (target: number) => {
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(query)) {
      if (value) params.set(key, value);
    }

    if (target > 1) params.set('page', String(target));

    const search = params.toString();
    return search ? `${basePath}?${search}` : basePath;
  };

  const firstItem = (page - 1) * limit + 1;
  const lastItem = Math.min(page * limit, total);

  return (
    <nav
      className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between"
      aria-label="Navigasi halaman"
    >
      <p className="text-sm text-ink-muted">
        {firstItem.toLocaleString('id-ID')}–{lastItem.toLocaleString('id-ID')} dari{' '}
        {total.toLocaleString('id-ID')} data
      </p>
      <div className="flex items-center gap-2">
        <Link
          href={hrefFor(page - 1)}
          aria-disabled={page <= 1}
          tabIndex={page <= 1 ? -1 : undefined}
          className={cn(
            'inline-flex h-11 items-center gap-1 border px-3 text-sm font-medium',
            page <= 1
              ? 'pointer-events-none border-border text-ink-faint opacity-50'
              : 'border-border-strong text-ink hover:border-primary hover:bg-primary-tint'
          )}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Sebelumnya
        </Link>
        <span className="min-w-20 text-center text-sm text-ink-muted">
          {page} / {totalPages}
        </span>
        <Link
          href={hrefFor(page + 1)}
          aria-disabled={page >= totalPages}
          tabIndex={page >= totalPages ? -1 : undefined}
          className={cn(
            'inline-flex h-11 items-center gap-1 border px-3 text-sm font-medium',
            page >= totalPages
              ? 'pointer-events-none border-border text-ink-faint opacity-50'
              : 'border-border-strong text-ink hover:border-primary hover:bg-primary-tint'
          )}
        >
          Berikutnya
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </nav>
  );
}
