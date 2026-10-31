import Link from 'next/link';
import {
  Activity,
  Ambulance,
  Building2,
  FlaskConical,
  Flower2,
  HandHeart,
  Hospital,
  Pill,
  ScanLine,
  Sparkles,
  Stethoscope,
  type LucideIcon
} from 'lucide-react';
import { facilityTypeLabels, facilityTypes, type FacilityTypeValue } from '@/lib/facility-types';

// Record penuh: menambah tipe fasilitas tanpa ikon akan gagal typecheck.
const facilityTypeIcons: Record<FacilityTypeValue, LucideIcon> = {
  HOSPITAL: Hospital,
  CLINIC: Building2,
  LABORATORY: FlaskConical,
  PHARMACY: Pill,
  PHYSIOTHERAPY: Activity,
  RADIOLOGY: ScanLine,
  FUNERAL_HOME: Flower2,
  WELLNESS: Sparkles,
  MASSAGE: HandHeart,
  AMBULANCE: Ambulance
};

// Dokter dipisah dari fasilitas: profesi berizin, alur dan verifikasinya berbeda.
export function PartnerMenuItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="px-3 text-sm font-semibold text-ink">Fasilitas kesehatan</p>
        <div className="mt-1 grid gap-1 sm:grid-cols-2 lg:grid-cols-5">
          {facilityTypes.map((type) => {
            const Icon = facilityTypeIcons[type];

            return (
              <Link
                key={type}
                href={`/mitra/daftar?type=${type}`}
                onClick={onNavigate}
                className="flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-ink hover:bg-primary-tint"
              >
                <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                {facilityTypeLabels[type]}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <p className="px-3 text-sm font-semibold text-ink">Tenaga medis</p>
        <Link
          href="/mitra/daftar?type=DOCTOR"
          onClick={onNavigate}
          className="mt-1 flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-ink hover:bg-primary-tint"
        >
          <Stethoscope className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          Dokter
        </Link>
      </div>
    </div>
  );
}
