import { Skeleton } from '@/components/ui/skeleton';

function LoadingLabel() {
  return <p className="sr-only">Memuat data...</p>;
}

export function AdminTableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div aria-busy="true">
      <LoadingLabel />
      <div className="overflow-hidden border border-border bg-white">
        <div
          className="grid gap-4 border-b border-border bg-surface px-4 py-3"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={`head-${index}`} className="h-4 w-20" />
          ))}
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div
              key={`row-${rowIndex}`}
              className="grid gap-4 px-4 py-4"
              style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: columns }).map((_, columnIndex) => (
                <Skeleton
                  key={`cell-${rowIndex}-${columnIndex}`}
                  className={columnIndex === 0 ? 'h-5 w-full max-w-40' : 'h-5 w-24'}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AdminDetailSkeleton() {
  return (
    <div aria-busy="true">
      <LoadingLabel />
      <Skeleton className="h-4 w-32" />
      <div className="mt-4 flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <Skeleton className="h-9 w-64 max-w-full" />
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-5 w-36" />
        </div>
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="border border-border bg-white p-5">
              <Skeleton className="h-6 w-40" />
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((__, itemIndex) => (
                  <div key={itemIndex} className="space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-5 w-full max-w-48" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="border border-border bg-white p-5">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-3 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-4/5" />
          <Skeleton className="mt-6 h-24 w-full" />
          <div className="mt-4 flex gap-2">
            <Skeleton className="h-11 w-28" />
            <Skeleton className="h-11 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminDashboardSkeleton() {
  return (
    <div aria-busy="true">
      <LoadingLabel />
      <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="border border-border bg-white p-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-8 w-20" />
            <Skeleton className="mt-2 h-3 w-28" />
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="border border-border bg-white p-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-2 h-4 w-56" />
          <div className="mt-4 divide-y divide-border border-y border-border">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between py-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-10" />
              </div>
            ))}
          </div>
        </div>
        <div className="border border-border bg-white p-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-2 h-4 w-52" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
      <Skeleton className="mt-4 h-3 w-40" />
    </div>
  );
}

export function AdminRouteSkeleton() {
  return (
    <div aria-busy="true">
      <LoadingLabel />
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-64 max-w-full" />
          <Skeleton className="h-5 w-80 max-w-full" />
        </div>
        <Skeleton className="h-11 w-28" />
      </div>
      <div className="mt-6">
        <AdminTableSkeleton rows={7} columns={5} />
      </div>
    </div>
  );
}
