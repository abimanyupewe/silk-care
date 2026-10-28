import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md border border-border bg-surface', className)}
      aria-hidden="true"
      {...props}
    />
  );
}
