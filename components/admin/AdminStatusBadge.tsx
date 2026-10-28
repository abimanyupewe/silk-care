import { CheckCircle2, Clock3, XCircle } from 'lucide-react';
import {
  adminReviewStatusLabels,
  adminVerificationStatusLabels,
  type AdminReviewStatus,
  type AdminVerificationStatus
} from '@/lib/admin-api';
import { cn } from '@/lib/utils';

type Status = AdminVerificationStatus | AdminReviewStatus | string;

const labels: Record<string, string> = {
  ...adminVerificationStatusLabels,
  ...adminReviewStatusLabels
};

export function AdminStatusBadge({ status, className }: { status: Status; className?: string }) {
  const normalized = status.toUpperCase();
  const label = labels[normalized] ?? status;
  const tone =
    normalized === 'VERIFIED' || normalized === 'APPROVED'
      ? 'border-primary bg-primary-tint text-primary-hover'
      : normalized === 'REJECTED'
        ? 'border-destructive bg-white text-destructive'
        : normalized === 'PENDING'
          ? 'border-amber bg-amber-tint text-amber-ink'
          : 'border-border bg-surface text-ink-muted';

  const Icon =
    normalized === 'VERIFIED' || normalized === 'APPROVED'
      ? CheckCircle2
      : normalized === 'REJECTED'
        ? XCircle
        : Clock3;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium',
        tone,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {label}
    </span>
  );
}
