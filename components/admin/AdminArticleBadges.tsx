import { CheckCircle2, Clock3, FileEdit, XCircle } from 'lucide-react';
import { adminArticleStatusLabels, type AdminArticleStatus } from '@/lib/admin-api';
import { cn } from '@/lib/utils';

const tone: Record<AdminArticleStatus, string> = {
  DRAFT: 'border-border-strong bg-surface text-ink',
  PENDING: 'border-amber bg-amber-tint text-amber-ink',
  PUBLISHED: 'border-primary bg-primary-tint text-primary-hover',
  REJECTED: 'border-destructive bg-white text-destructive'
};

const icon: Record<AdminArticleStatus, typeof FileEdit> = {
  DRAFT: FileEdit,
  PENDING: Clock3,
  PUBLISHED: CheckCircle2,
  REJECTED: XCircle
};

export function AdminArticleStatusBadge({
  status,
  className
}: {
  status: AdminArticleStatus;
  className?: string;
}) {
  const Icon = icon[status] ?? FileEdit;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 border px-2 py-1 text-xs font-medium',
        tone[status] ?? 'border-border bg-surface text-ink-muted',
        className
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {adminArticleStatusLabels[status] ?? status}
    </span>
  );
}
