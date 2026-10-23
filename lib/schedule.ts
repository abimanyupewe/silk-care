import type { Prisma } from '@/lib/generated/prisma';
import { z } from 'zod';

export const scheduleDays = [1, 2, 3, 4, 5, 6, 7] as const;

export const doctorScheduleSelect = {
  id: true,
  dayOfWeek: true,
  startTime: true,
  endTime: true,
  isActive: true
} satisfies Prisma.DoctorScheduleSelect;

export const facilityOperatingHourSelect = {
  id: true,
  dayOfWeek: true,
  openTime: true,
  closeTime: true,
  isClosed: true
} satisfies Prisma.FacilityOperatingHourSelect;

const dayOfWeekSchema = z.number().int().min(1).max(7);
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Format waktu harus HH:mm.');

export const doctorScheduleItemSchema = z.object({
  dayOfWeek: dayOfWeekSchema,
  startTime: timeSchema,
  endTime: timeSchema,
  isActive: z.boolean().default(true)
});

export const doctorSchedulePutSchema = z.object({
  schedules: z.array(doctorScheduleItemSchema).max(50)
});

export const facilityOperatingHourItemSchema = z.object({
  dayOfWeek: dayOfWeekSchema,
  openTime: timeSchema.nullable().optional(),
  closeTime: timeSchema.nullable().optional(),
  isClosed: z.boolean().default(false)
});

export const facilityOperatingHourPutSchema = z.object({
  operatingHours: z.array(facilityOperatingHourItemSchema).max(7)
});

export function validateDoctorSchedules(
  schedules: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isActive: boolean;
  }>
) {
  for (const schedule of schedules) {
    if (schedule.startTime >= schedule.endTime) {
      return 'Jam mulai harus lebih awal dari jam selesai.';
    }
  }

  for (const day of scheduleDays) {
    const activeSchedules = schedules
      .filter((schedule) => schedule.dayOfWeek === day && schedule.isActive)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    for (let index = 1; index < activeSchedules.length; index += 1) {
      if (activeSchedules[index].startTime < activeSchedules[index - 1].endTime) {
        return 'Jadwal dokter tidak boleh saling tumpang tindih pada hari yang sama.';
      }
    }
  }

  return null;
}

export function normalizeFacilityOperatingHours(
  operatingHours: Array<{
    dayOfWeek: number;
    openTime?: string | null;
    closeTime?: string | null;
    isClosed: boolean;
  }>
):
  | {
      ok: true;
      data: Array<{
        dayOfWeek: number;
        openTime: string | null;
        closeTime: string | null;
        isClosed: boolean;
      }>;
    }
  | {
      ok: false;
      error: string;
    } {
  const days = new Set<number>();

  for (const hour of operatingHours) {
    if (days.has(hour.dayOfWeek)) {
      return { ok: false, error: 'Setiap hari hanya boleh memiliki satu jam operasional.' };
    }

    days.add(hour.dayOfWeek);

    if (hour.isClosed) {
      continue;
    }

    if (!hour.openTime || !hour.closeTime) {
      return { ok: false, error: 'Jam buka dan tutup wajib diisi untuk hari yang buka.' };
    }

    if (hour.openTime >= hour.closeTime) {
      return { ok: false, error: 'Jam buka harus lebih awal dari jam tutup.' };
    }
  }

  return {
    ok: true,
    data: operatingHours.map((hour) => ({
      dayOfWeek: hour.dayOfWeek,
      openTime: hour.isClosed ? null : (hour.openTime ?? null),
      closeTime: hour.isClosed ? null : (hour.closeTime ?? null),
      isClosed: hour.isClosed
    }))
  };
}
