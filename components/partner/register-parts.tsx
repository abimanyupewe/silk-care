import { AlertCircle } from 'lucide-react';

export const fieldClass =
  'mt-2 w-full border border-border-strong bg-white px-3 text-base text-ink outline-none placeholder:text-ink-faint focus:border-primary';

export function FormError({ message }: { message?: string }) {
  return (
    <p aria-live="polite" className="text-sm text-destructive">
      {message ? (
        <span className="mt-1 flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {message}
        </span>
      ) : null}
    </p>
  );
}

export function AccountField({
  id,
  label,
  type = 'text',
  autoComplete,
  help,
  value,
  error,
  onChange
}: {
  id: string;
  label: string;
  type?: string;
  autoComplete: string;
  help?: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
      </label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        value={value}
        aria-required
        aria-invalid={error ? true : undefined}
        aria-describedby={help ? `${id}-help` : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={`${fieldClass} h-12`}
      />
      {help ? (
        <p id={`${id}-help`} className="mt-1 text-sm text-ink-muted">
          {help}
        </p>
      ) : null}
      <FormError message={error} />
    </div>
  );
}

export function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-border py-2 last:border-b-0 sm:flex-row sm:gap-4">
      <dt className="text-sm text-ink-muted sm:w-48 sm:shrink-0">{label}</dt>
      <dd className="min-w-0 break-words text-ink">{value}</dd>
    </div>
  );
}
