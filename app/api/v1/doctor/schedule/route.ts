import { prisma } from '@/lib/db';
import { requireDoctorProfile } from '@/lib/doctor-guard';
import { handleRouteError, jsonError, jsonOk, parseJson } from '@/lib/api';
import {
  doctorSchedulePutSchema,
  doctorScheduleSelect,
  validateDoctorSchedules
} from '@/lib/schedule';

export async function GET() {
  try {
    const auth = await requireDoctorProfile();

    if (!auth.ok) {
      return auth.error;
    }

    const schedules = await prisma.doctorSchedule.findMany({
      where: {
        doctorProfileId: auth.doctor.id
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      select: doctorScheduleSelect
    });

    return jsonOk(schedules);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireDoctorProfile();

    if (!auth.ok) {
      return auth.error;
    }

    const parsed = await parseJson(request, doctorSchedulePutSchema);

    if (parsed.error) {
      return parsed.error;
    }

    const validationError = validateDoctorSchedules(parsed.data.schedules);

    if (validationError) {
      return jsonError(validationError, 422);
    }

    const schedules = await prisma.$transaction(async (tx) => {
      await tx.doctorSchedule.deleteMany({
        where: {
          doctorProfileId: auth.doctor.id
        }
      });

      if (parsed.data.schedules.length > 0) {
        await tx.doctorSchedule.createMany({
          data: parsed.data.schedules.map((schedule) => ({
            doctorProfileId: auth.doctor.id,
            dayOfWeek: schedule.dayOfWeek,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            isActive: schedule.isActive
          }))
        });
      }

      return tx.doctorSchedule.findMany({
        where: {
          doctorProfileId: auth.doctor.id
        },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        select: doctorScheduleSelect
      });
    });

    return jsonOk(schedules);
  } catch (error) {
    return handleRouteError(error);
  }
}
