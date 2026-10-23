import { prisma } from '@/lib/db';
import { requireFacility } from '@/lib/facility-guard';
import { handleRouteError, jsonError, jsonOk, parseJson } from '@/lib/api';
import {
  facilityOperatingHourPutSchema,
  facilityOperatingHourSelect,
  normalizeFacilityOperatingHours
} from '@/lib/schedule';

export async function GET() {
  try {
    const auth = await requireFacility();

    if (!auth.ok) {
      return auth.error;
    }

    const operatingHours = await prisma.facilityOperatingHour.findMany({
      where: {
        facilityId: auth.facility.id
      },
      orderBy: {
        dayOfWeek: 'asc'
      },
      select: facilityOperatingHourSelect
    });

    return jsonOk(operatingHours);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireFacility();

    if (!auth.ok) {
      return auth.error;
    }

    const parsed = await parseJson(request, facilityOperatingHourPutSchema);

    if (parsed.error) {
      return parsed.error;
    }

    const normalized = normalizeFacilityOperatingHours(parsed.data.operatingHours);

    if (!normalized.ok) {
      return jsonError(normalized.error, 422);
    }

    const operatingHours = await prisma.$transaction(async (tx) => {
      await tx.facilityOperatingHour.deleteMany({
        where: {
          facilityId: auth.facility.id
        }
      });

      if (normalized.data.length > 0) {
        await tx.facilityOperatingHour.createMany({
          data: normalized.data.map((hour) => ({
            facilityId: auth.facility.id,
            dayOfWeek: hour.dayOfWeek,
            openTime: hour.openTime,
            closeTime: hour.closeTime,
            isClosed: hour.isClosed
          }))
        });
      }

      return tx.facilityOperatingHour.findMany({
        where: {
          facilityId: auth.facility.id
        },
        orderBy: {
          dayOfWeek: 'asc'
        },
        select: facilityOperatingHourSelect
      });
    });

    return jsonOk(operatingHours);
  } catch (error) {
    return handleRouteError(error);
  }
}
