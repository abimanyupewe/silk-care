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
export const facilityTypeIcons: Record<FacilityTypeValue, LucideIcon> = {
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
// Belum bisa diklik sampai pendaftaran dokter tersedia.
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
        <div
          aria-disabled="true"
          className="mt-1 flex items-start gap-3 rounded-md bg-surface px-3 py-3"
        >
          <Stethoscope className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" aria-hidden="true" />
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink">
              Dokter
              <span className="border border-border-strong bg-white px-2 text-sm text-ink-muted">
                Segera hadir
              </span>
            </span>
            <span className="mt-0.5 block text-sm text-ink-muted">
              Khusus dokter berizin, diverifikasi admin. Pendaftaran dokter belum tersedia.
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
