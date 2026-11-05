import { z } from 'zod';
import { partnerRequirements } from './partners';
import type { PartnerType, RequirementField, RequirementStep } from './types';

// Rentang angka per kunci; selain itu bilangan bulat >= 0.
const numberBounds: Record<string, [number, number]> = {
  latitude: [-90, 90],
  longitude: [-180, 180],
  experienceYears: [0, 80]
};
const maxLength: Record<string, number> = { name: 150, address: 500, description: 2000, bio: 2000 };

function fieldSchema(field: RequirementField): z.ZodType {
  const max = maxLength[field.key] ?? (field.kind === 'textarea' ? 2000 : 200);
  let schema: z.ZodType;
  switch (field.kind) {
    case 'boolean':
      schema = z.boolean();
      break;
    case 'number': {
      const [min, hi] = numberBounds[field.key] ?? [0, 1_000_000];
      const n = z.number().min(min).max(hi);
      schema = field.key in numberBounds && field.key !== 'experienceYears' ? n : n.int();
      break;
    }
    case 'select':
    case 'multiselect': {
      const values = (field.options ?? []).map((o) => o.value) as [string, ...string[]];
      schema = field.kind === 'select' ? z.enum(values) : z.array(z.enum(values)).max(30);
      break;
    }
    case 'list':
      schema = z.array(z.string().trim().min(1).max(max)).max(30);
      break;
    case 'phone':
      schema = z.string().trim().min(8).max(20);
      break;
    case 'url':
      schema = z.string().trim().url().max(500);
      break;
    default:
      schema = z
        .string()
        .trim()
        .min(field.key === 'name' ? 2 : 1)
        .max(max);
  }
  return field.required ? schema : schema.nullish();
}

function shapeOf(fields: RequirementField[]) {
  return Object.fromEntries(fields.map((f) => [f.key, fieldSchema(f)]));
}

export function buildStepSchema(step: RequirementStep) {
  return z.object(shapeOf(step.fields));
}

// z.object membuang kunci asing, jadi klien tidak bisa menyelundupkan kolom.
export function buildPartnerSchema(type: PartnerType) {
  return z.object(shapeOf(partnerRequirements[type].steps.flatMap((s) => s.fields)));
}

export function splitValues(type: PartnerType, values: Record<string, unknown>) {
  const columns: Record<string, unknown> = {};
  const details: Record<string, unknown> = {};
  const internalDetails: Record<string, unknown> = {};
  const buckets = { column: columns, details, internal: internalDetails };
  for (const field of partnerRequirements[type].steps.flatMap((s) => s.fields)) {
    const value = values[field.key];
    if (value !== undefined && value !== null) buckets[field.target][field.key] = value;
  }
  return { columns, details, internalDetails };
}
