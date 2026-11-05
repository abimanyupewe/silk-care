'use client';

import { AlertCircle, Plus, X } from 'lucide-react';
import type { RequirementField } from '@/lib/partner-requirements/types';

const fieldClass =
  'mt-2 w-full border border-border-strong bg-white px-3 text-base text-ink outline-none placeholder:text-ink-faint focus:border-primary';
const choiceClass = 'flex min-h-11 items-center gap-3 text-base text-ink';
const smallButtonClass =
  'inline-flex min-h-11 items-center justify-center gap-2 border border-border-strong bg-white px-4 text-sm font-semibold text-ink hover:bg-surface';

type Props = {
  fields: RequirementField[];
  values: Record<string, unknown>;
  errors: Record<string, string>;
  onChange: (key: string, value: unknown) => void;
};

export function RequirementFields({ fields, values, errors, onChange }: Props) {
  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <FieldControl
          key={field.key}
          field={field}
          value={values[field.key]}
          error={errors[field.key]}
          onChange={(value) => onChange(field.key, value)}
        />
      ))}
    </div>
  );
}

function FieldControl({
  field,
  value,
  error,
  onChange
}: {
  field: RequirementField;
  value: unknown;
  error?: string;
  onChange: (value: unknown) => void;
}) {
  const id = `rf-${field.key}`;
  const helpId = field.helpText ? `${id}-help` : undefined;
  const errorId = `${id}-error`;
  const describedBy = [helpId, error ? errorId : undefined].filter(Boolean).join(' ') || undefined;
  const label = (
    <>
      {field.label}
      {field.required ? (
        <span className="text-destructive" aria-hidden="true">
          {' *'}
        </span>
      ) : (
        <span className="font-normal text-ink-muted"> (opsional)</span>
      )}
    </>
  );
  const isGroup = field.kind === 'boolean' || field.kind === 'multiselect' || field.kind === 'list';
  const common = {
    id,
    'aria-describedby': describedBy,
    'aria-invalid': error ? true : undefined,
    'aria-required': field.required || undefined
  };
  const str = typeof value === 'string' ? value : '';
  let control: React.ReactNode = null;

  switch (field.kind) {
    case 'textarea':
      control = (
        <textarea
          {...common}
          rows={3}
          value={str}
          onChange={(e) => onChange(e.target.value)}
          className={`${fieldClass} py-2`}
        />
      );
      break;
    case 'number':
      control = (
        <input
          {...common}
          type="number"
          step="any"
          value={typeof value === 'number' ? value : ''}
          onChange={(e) => onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)}
          className={`${fieldClass} h-12`}
        />
      );
      break;
    case 'select':
      control = (
        <select
          {...common}
          value={str}
          onChange={(e) => onChange(e.target.value)}
          className={`${fieldClass} h-12`}
        >
          <option value="">Pilih</option>
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
      break;
    case 'boolean':
      control = (
        <div className="mt-1 flex gap-6">
          {[
            { v: true, text: 'Ya' },
            { v: false, text: 'Tidak' }
          ].map(({ v, text }) => (
            <label key={text} className={choiceClass}>
              <input
                type="radio"
                name={id}
                checked={value === v}
                onChange={() => onChange(v)}
                className="h-5 w-5 accent-primary"
              />
              {text}
            </label>
          ))}
        </div>
      );
      break;
    case 'multiselect': {
      const selected = Array.isArray(value) ? (value as string[]) : [];

      control = (
        <div className="mt-1 grid gap-x-6 sm:grid-cols-2">
          {field.options?.map((o) => (
            <label key={o.value} className={choiceClass}>
              <input
                type="checkbox"
                checked={selected.includes(o.value)}
                onChange={(e) =>
                  onChange(
                    e.target.checked
                      ? [...selected, o.value]
                      : selected.filter((s) => s !== o.value)
                  )
                }
                className="h-5 w-5 accent-primary"
              />
              {o.label}
            </label>
          ))}
        </div>
      );
      break;
    }
    case 'list': {
      const rows = Array.isArray(value) ? (value as string[]) : [];

      control = (
        <div className="mt-2 space-y-2">
          {rows.map((row, index) => (
            <div key={index} className="flex gap-2">
              <input
                id={index === 0 ? id : undefined}
                aria-label={`${field.label} ${index + 1}`}
                value={row}
                onChange={(e) => onChange(rows.map((r, i) => (i === index ? e.target.value : r)))}
                className="h-12 min-w-0 flex-1 border border-border-strong bg-white px-3 text-base text-ink outline-none focus:border-primary"
              />
              <button
                type="button"
                aria-label={`Hapus ${field.label} ${index + 1}`}
                onClick={() => onChange(rows.filter((_, i) => i !== index))}
                className="inline-flex h-12 w-12 shrink-0 items-center justify-center border border-border-strong bg-white text-ink hover:bg-surface"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => onChange([...rows, ''])}
            className={smallButtonClass}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Tambah
          </button>
        </div>
      );
      break;
    }
    default:
      control = (
        <input
          {...common}
          type={field.kind === 'phone' ? 'tel' : field.kind === 'url' ? 'url' : 'text'}
          value={str}
          onChange={(e) => onChange(e.target.value)}
          className={`${fieldClass} h-12`}
        />
      );
  }

  return (
    <div>
      {isGroup ? (
        <fieldset aria-describedby={describedBy}>
          <legend className="text-sm font-semibold text-ink">{label}</legend>
          {control}
        </fieldset>
      ) : (
        <>
          <label htmlFor={id} className="text-sm font-semibold text-ink">
            {label}
          </label>
          {control}
        </>
      )}
      {field.helpText ? (
        <p id={helpId} className="mt-1 text-sm text-ink-muted">
          {field.helpText}
        </p>
      ) : null}
      <p id={errorId} aria-live="polite" className="text-sm text-destructive">
        {error ? (
          <span className="mt-1 flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {error}
          </span>
        ) : null}
      </p>
    </div>
  );
}
