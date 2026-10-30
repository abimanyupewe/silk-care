import type { Prisma } from '@/lib/generated/prisma';
import { timeToMinutes } from '@/lib/consultation';

export const appointmentStatuses = ['REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as const;

export type AppointmentStatusValue = (typeof appointmentStatuses)[number];

export const appointmentStatusLabels: Record<AppointmentStatusValue, string> = {
  REQUESTED: 'Menunggu konfirmasi',
  CONFIRMED: 'Dikonfirmasi',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan'
};

export const appointmentListSelect = {
  id: true,
  status: true,
  scheduledAt: true,
  endsAt: true,
  durationMinutes: true,
  serviceName: true,
  price: true,
  priceMax: true,
  notes: true,
  cancelReason: true,
  createdAt: true,
  facility: {
    select: {
      name: true,
      slug: true
    }
  },
  patient: {
    select: {
      name: true
    }
  }
} satisfies Prisma.AppointmentSelect;

export const appointmentDetailSelect = {
  ...appointmentListSelect,
  confirmedAt: true,
  completedAt: true,
  cancelledAt: true,
  updatedAt: true,
  patient: {
    select: {
      name: true,
      email: true
    }
  }
} satisfies Prisma.AppointmentSelect;

// Hari 1–7 (Senin–Minggu), sama dengan getJakartaSchedulePosition dan FacilityOperatingHour.
export function isWithinOperatingHours({
  dayOfWeek,
  minutes,
  durationMinutes,
  hours
}: {
  dayOfWeek: number;
  minutes: number;
  durationMinutes: number;
  hours: Array<{
    dayOfWeek: number;
    openTime: string | null;
    closeTime: string | null;
    isClosed: boolean;
  }>;
}) {
  return hours.some((hour) => {
    if (hour.isClosed || hour.dayOfWeek !== dayOfWeek || !hour.openTime || !hour.closeTime) {
      return false;
    }

    return (
      minutes >= timeToMinutes(hour.openTime) &&
      minutes + durationMinutes <= timeToMinutes(hour.closeTime)
    );
  });
}

export function formatAppointmentSchedule(date: Date) {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta'
  }).format(date);
}
