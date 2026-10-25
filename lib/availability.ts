import type { Prisma } from '@/lib/generated/prisma';
import { getBoolean } from '@/lib/api';
import { getJakartaSchedulePosition } from '@/lib/consultation';
import { scheduleDays } from '@/lib/schedule';

const dayPattern = /^[1-7]$/;
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export type AvailabilityFilter = {
  dayOfWeek: number;
  time: string;
};

export type AvailabilityFilterResult =
  | { ok: true; filter?: AvailabilityFilter }
  | { ok: false; error: string };

export function parseAvailabilityFilter(searchParams: URLSearchParams): AvailabilityFilterResult {
  const availableNow = getBoolean(searchParams, 'availableNow');

  if (availableNow) {
    const position = getJakartaSchedulePosition(new Date());

    return {
      ok: true,
      filter: {
        dayOfWeek: position.dayOfWeek,
        time: position.time
      }
    };
  }

  const dayRaw = searchParams.get('day')?.trim();
  const timeRaw = searchParams.get('time')?.trim();

  if (!dayRaw && !timeRaw) {
    return { ok: true };
  }

  if (!dayRaw || !timeRaw) {
    return { ok: false, error: 'day dan time harus diisi bersamaan.' };
  }

  if (!dayPattern.test(dayRaw)) {
    return { ok: false, error: 'day harus berada di antara 1 (Senin) dan 7 (Minggu).' };
  }

  if (!timePattern.test(timeRaw)) {
    return { ok: false, error: 'time harus menggunakan format HH:mm.' };
  }

  const day = Number(dayRaw);

  if (!scheduleDays.includes(day as (typeof scheduleDays)[number])) {
    return { ok: false, error: 'day harus berada di antara 1 (Senin) dan 7 (Minggu).' };
  }

  return {
    ok: true,
    filter: {
      dayOfWeek: day,
      time: timeRaw
    }
  };
}

export function doctorAvailabilityWhere(
  filter: AvailabilityFilter
): Prisma.DoctorScheduleListRelationFilter {
  return {
    some: {
      dayOfWeek: filter.dayOfWeek,
      isActive: true,
      startTime: {
        lte: filter.time
      },
      endTime: {
        gt: filter.time
      }
    }
  };
}

export function facilityAvailabilityWhere(
  filter: AvailabilityFilter
): Prisma.FacilityOperatingHourListRelationFilter {
  return {
    some: {
      dayOfWeek: filter.dayOfWeek,
      isClosed: false,
      openTime: {
        lte: filter.time
      },
      closeTime: {
        gt: filter.time
      }
    }
  };
}
