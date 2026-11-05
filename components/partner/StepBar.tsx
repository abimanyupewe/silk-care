import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StepBarItem = { id: string; title: string; hint: string };

// Status langkah selalu berpasangan dengan ikon/teks, bukan warna saja (selesai: centang).
export function StepBar({ steps, index }: { steps: StepBarItem[]; index: number }) {
  const current = steps[index];

  return (
    <nav aria-label="Langkah pendaftaran">
      <ol className="flex items-start">
        {steps.map((s, i) => {
          const done = i < index;
          const active = i === index;

          return (
            <li
              key={s.id}
              aria-current={active ? 'step' : undefined}
              className="relative flex min-w-0 flex-1 flex-col items-center text-center"
            >
              {i > 0 ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute -left-1/2 top-4 ml-4 h-px w-[calc(100%-2rem)]',
                    i <= index ? 'bg-primary' : 'bg-border-strong'
                  )}
                />
              ) : null}
              <span
                className={cn(
                  'relative z-10 flex h-8 w-8 items-center justify-center border text-sm font-semibold',
                  done && 'border-primary bg-primary text-white',
                  active && 'border-2 border-primary bg-white text-primary-hover',
                  !done && !active && 'border-border-strong bg-white text-ink-muted'
                )}
              >
                {done ? <Check className="h-4 w-4" aria-hidden="true" /> : i + 1}
              </span>
              <span
                className={cn(
                  'mt-2 hidden px-1 text-sm sm:block',
                  active ? 'font-semibold text-ink' : 'text-ink-muted'
                )}
              >
                {s.title}
                <span className="sr-only">
                  {done ? ' (selesai)' : active ? ' (sedang diisi)' : ' (belum diisi)'}
                </span>
              </span>
              <span className="mt-0.5 hidden px-1 text-sm leading-snug text-ink-muted sm:block">
                {s.hint}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="mt-4 text-sm text-ink-muted sm:hidden" aria-hidden="true">
        <span className="font-semibold text-ink">
          Langkah {index + 1} dari {steps.length}: {current.title}
        </span>
        {' — '}
        {current.hint}
      </p>
      <p className="sr-only" aria-live="polite">
        Langkah {index + 1} dari {steps.length}: {current.title}. {current.hint}
      </p>
    </nav>
  );
}
