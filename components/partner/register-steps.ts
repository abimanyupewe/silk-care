import type {
  FieldKind,
  PartnerType,
  RequirementField,
  RequirementStep
} from '@/lib/partner-requirements/types';
import { partnerRequirements } from '@/lib/partner-requirements/partners';

export type FormStepId = 'account' | 'basic' | 'details' | 'location' | 'review';
export type FormStep = { id: FormStepId; title: string; registry: RequirementStep[] };

// Pengelompokan langkah dari steps registry: 'basic' -> Data dasar, 'location' -> Lokasi,
// sisanya -> Detail tipe (dilewati bila kosong). Tipe belum dipilih: asumsikan ada Detail tipe.
export function buildFormSteps(type: PartnerType | undefined, withAccount: boolean): FormStep[] {
  const steps = type ? partnerRequirements[type].steps : [];
  const pick = (pred: (s: RequirementStep) => boolean) => steps.filter(pred);
  const details = pick((s) => s.id !== 'basic' && s.id !== 'location' && s.fields.length > 0);
  const result: FormStep[] = [];

  if (withAccount) result.push({ id: 'account', title: 'Akun', registry: [] });
  result.push({ id: 'basic', title: 'Data dasar', registry: pick((s) => s.id === 'basic') });
  if (details.length > 0 || !type) {
    result.push({ id: 'details', title: 'Detail tipe', registry: details });
  }
  result.push({ id: 'location', title: 'Lokasi', registry: pick((s) => s.id === 'location') });
  result.push({ id: 'review', title: 'Tinjau', registry: [] });

  return result;
}

// Buang isian kosong supaya tidak pernah mengirim '' / null untuk field yang tidak diisi.
export function cleanValues(fields: RequirementField[], values: Record<string, unknown>) {
  const out: Record<string, unknown> = {};

  for (const { key } of fields) {
    const v = values[key];

    if (typeof v === 'string') {
      if (v.trim()) out[key] = v.trim();
    } else if (Array.isArray(v)) {
      const items = v.map((i) => (typeof i === 'string' ? i.trim() : i)).filter((i) => i !== '');

      if (items.length) out[key] = items;
    } else if (typeof v === 'number' ? Number.isFinite(v) : typeof v === 'boolean') {
      out[key] = v;
    }
  }

  return out;
}

const kindsWithChoice: FieldKind[] = ['select', 'multiselect', 'boolean', 'list'];

export function fieldErrorText(field: RequirementField, values: Record<string, unknown>) {
  const filled = values[field.key] !== undefined;

  if (!filled) return 'Wajib diisi.';
  return kindsWithChoice.includes(field.kind) ? 'Pilihan tidak valid.' : 'Isian tidak valid.';
}
