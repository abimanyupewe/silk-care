import { facilityTypes } from '../facility-types';

export const partnerTypes = [...facilityTypes, 'DOCTOR'] as const;
export type PartnerType = (typeof partnerTypes)[number];

export function isPartnerType(value: unknown): value is PartnerType {
  return typeof value === 'string' && (partnerTypes as readonly string[]).includes(value);
}

export type FieldKind =
  | 'text'
  | 'textarea'
  | 'number'
  | 'boolean'
  | 'select'
  | 'multiselect'
  | 'list'
  | 'phone'
  | 'url';

export type RequirementField = {
  key: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  options?: { value: string; label: string }[];
  helpText?: string;
  filterable?: boolean;
  target: 'column' | 'details' | 'internal';
};

export type RequirementStep = { id: string; title: string; fields: RequirementField[] };

export type PartnerRequirement = { draft: boolean; steps: RequirementStep[] };
