import { CheckCircle2, Clock3, CreditCard, Package, RefreshCw, Truck, XCircle } from 'lucide-react';
import {
  adminOrderStatusLabels,
  adminPaymentStatusLabels,
  type AdminOrderStatus,
  type AdminPaymentStatus
} from '@/lib/admin-api';
import { cn } from '@/lib/utils';

const orderTone: Record<AdminOrderStatus, string> = {
  PENDING: 'border-amber bg-amber-tint text-amber-ink',
  PAID: 'border-primary bg-primary-tint text-primary-hover',
  PROCESSING: 'border-border-strong bg-surface text-ink',
  SHIPPED: 'border-primary bg-primary-tint text-primary-hover',
  COMPLETED: 'border-primary bg-primary-tint text-primary-hover',
  CANCELLED: 'border-destructive bg-white text-destructive'
};

const orderIcon: Record<AdminOrderStatus, typeof Clock3> = {
  PENDING: Clock3,
  PAID: CreditCard,
  PROCESSING: Package,
  SHIPPED: Truck,
  COMPLETED: CheckCircle2,
  CANCELLED: XCircle
};

const paymentTone: Record<AdminPaymentStatus, string> = {
  UNPAID: 'border-amber bg-amber-tint text-amber-ink',
  PAID: 'border-primary bg-primary-tint text-primary-hover',
  FAILED: 'border-destructive bg-white text-destructive',
  REFUNDED: 'border-border-strong bg-surface text-ink'
};

const paymentIcon: Record<AdminPaymentStatus, typeof Clock3> = {
  UNPAID: Clock3,
  PAID: CreditCard,
  FAILED: XCircle,
  REFUNDED: RefreshCw
};

export function AdminOrderStatusBadge({
  status,
  className
}: {
  status: AdminOrderStatus;
  className?: string;
}) {
  const Icon = orderIcon[status] ?? Clock3;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 border px-2 py-1 text-xs font-medium',
        orderTone[status] ?? 'border-border bg-surface text-ink-muted',
        className
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {adminOrderStatusLabels[status] ?? status}
    </span>
  );
}

export function AdminPaymentStatusBadge({
  status,
  className
}: {
  status: AdminPaymentStatus;
  className?: string;
}) {
  const Icon = paymentIcon[status] ?? Clock3;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 border px-2 py-1 text-xs font-medium',
        paymentTone[status] ?? 'border-border bg-surface text-ink-muted',
        className
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {adminPaymentStatusLabels[status] ?? status}
    </span>
  );
}
