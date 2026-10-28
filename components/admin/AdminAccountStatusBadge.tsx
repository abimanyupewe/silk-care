import { UserCheck, UserX } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AdminAccountStatusBadge({
  active,
  className
}: {
  active: boolean;
  className?: string;
}) {
  const Icon = active ? UserCheck : UserX;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium',
        active
          ? 'border-primary bg-primary-tint text-primary-hover'
          : 'border-destructive bg-white text-destructive',
        className
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {active ? 'Aktif' : 'Nonaktif'}
    </span>
  );
}
