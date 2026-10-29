import { AlertCircle, Inbox } from 'lucide-react';

export function AdminErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="border border-destructive bg-white p-4" aria-live="polite">
      <p className="flex items-start gap-2 text-sm text-destructive">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        {message}
      </p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 inline-flex min-h-11 items-center border border-border-strong px-3 text-sm font-semibold text-ink hover:border-primary hover:bg-primary-tint"
        >
          Coba lagi
        </button>
      ) : null}
    </div>
  );
}

export function AdminEmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="border border-border bg-surface p-8 text-center">
      <Inbox className="mx-auto h-8 w-8 text-ink-faint" aria-hidden="true" />
      <p className="mt-3 font-semibold text-ink">{title}</p>
      {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
    </div>
  );
}
