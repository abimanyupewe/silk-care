import type { Prisma } from '@/lib/generated/prisma';

export const consultationTypes = ['ONLINE', 'IN_PERSON'] as const;
export const consultationStatuses = ['REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as const;

export const consultationTypeLabels: Record<(typeof consultationTypes)[number], string> = {
  ONLINE: 'Online',
  IN_PERSON: 'Tatap muka'
};

export const medicalRecordSelect = {
  id: true,
  consultationId: true,
  diagnosis: true,
  notes: true,
  prescription: true,
  followUpAt: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.MedicalRecordSelect;

export const medicalRecordDetailSelect = {
  ...medicalRecordSelect,
  doctorProfile: {
    select: {
      id: true,
      slug: true,
      specialty: true,
      city: true,
      photoUrl: true,
      user: {
        select: {
          name: true,
          image: true
        }
      }
    }
  },
  consultation: {
    select: {
      id: true,
      type: true,
      scheduledAt: true,
      endsAt: true,
      complaint: true,
      status: true
    }
  }
} satisfies Prisma.MedicalRecordSelect;

export const consultationListSelect = {
  id: true,
  status: true,
  type: true,
  scheduledAt: true,
  endsAt: true,
  durationMinutes: true,
  fee: true,
  complaint: true,
  createdAt: true,
  updatedAt: true,
  doctorProfile: {
    select: {
      id: true,
      slug: true,
      specialty: true,
      city: true,
      photoUrl: true,
      user: {
        select: {
          name: true,
          image: true
        }
      }
    }
  },
  patient: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      image: true
    }
  }
} satisfies Prisma.ConsultationSelect;

export const consultationDetailSelect = {
  ...consultationListSelect,
  cancelReason: true,
  confirmedAt: true,
  completedAt: true,
  cancelledAt: true,
  medicalRecord: {
    select: medicalRecordSelect
  }
} satisfies Prisma.ConsultationSelect;

const dayOfWeekMap: Record<string, number> = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7
};

export function getJakartaSchedulePosition(date: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date);
  const weekday = parts.find((part) => part.type === 'weekday')?.value ?? '';
  const hour = parts.find((part) => part.type === 'hour')?.value ?? '00';
  const minute = parts.find((part) => part.type === 'minute')?.value ?? '00';

  return {
    dayOfWeek: dayOfWeekMap[weekday] ?? 1,
    time: `${hour}:${minute}`,
    minutes: Number(hour) * 60 + Number(minute)
  };
}

export function timeToMinutes(value: string) {
  const [hour, minute] = value.split(':').map(Number);

  return hour * 60 + minute;
}

export function isWithinDoctorSchedule({
  dayOfWeek,
  minutes,
  durationMinutes,
  schedules
}: {
  dayOfWeek: number;
  minutes: number;
  durationMinutes: number;
  schedules: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isActive: boolean;
  }>;
}) {
  return schedules.some((schedule) => {
    if (!schedule.isActive || schedule.dayOfWeek !== dayOfWeek) {
      return false;
    }

    const start = timeToMinutes(schedule.startTime);
    const end = timeToMinutes(schedule.endTime);

    return minutes >= start && minutes + durationMinutes <= end;
  });
}
