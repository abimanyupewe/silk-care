import { Prisma } from '@/lib/generated/prisma';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth-guard';
import { auditActions, writeAuditLog } from '@/lib/audit';
import { handleRouteError, jsonError, jsonOk, parseJson } from '@/lib/api';
import { announcementSelect, validateAnnouncementState } from '@/lib/announcement';
import { announcementUpdateSchema } from '@/lib/announcement-schema';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const auth = await requireRole(['ADMIN']);

    if (!auth.ok) {
      return auth.error;
    }

    const { id } = await context.params;
    const announcement = await prisma.announcement.findUnique({
      where: { id },
      select: announcementSelect
    });

    if (!announcement) {
      return jsonError('Banner tidak ditemukan.', 404);
    }

    return jsonOk(announcement);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await requireRole(['ADMIN']);

    if (!auth.ok) {
      return auth.error;
    }

    const { id } = await context.params;
    const existing = await prisma.announcement.findUnique({
      where: { id },
      select: announcementSelect
    });

    if (!existing) {
      return jsonError('Banner tidak ditemukan.', 404);
    }

    const parsed = await parseJson(request, announcementUpdateSchema);

    if (parsed.error) {
      return parsed.error;
    }

    const data = parsed.data;
    // Aturan dievaluasi terhadap nilai gabungan: mengubah satu field tidak boleh meloloskan
    // keadaan yang tidak valid (mis. endsAt sebelum startsAt yang sudah tersimpan).
    const stateError = validateAnnouncementState({
      message: data.message ?? existing.message,
      linkLabel: data.linkLabel === undefined ? existing.linkLabel : data.linkLabel,
      linkUrl: data.linkUrl === undefined ? existing.linkUrl : data.linkUrl,
      active: data.active ?? existing.active,
      startsAt: data.startsAt === undefined ? existing.startsAt : data.startsAt,
      endsAt: data.endsAt === undefined ? existing.endsAt : data.endsAt
    });

    if (stateError) {
      return jsonError(stateError, 422);
    }

    try {
      const announcement = await prisma.$transaction(async (tx) => {
        if (data.active) {
          await tx.announcement.updateMany({
            where: { active: true, id: { not: id } },
            data: { active: false }
          });
        }

        const updated = await tx.announcement.update({
          where: { id },
          data,
          select: announcementSelect
        });

        await writeAuditLog(
          {
            actorId: auth.user.id,
            action: auditActions.announcementUpdate,
            targetType: 'ANNOUNCEMENT',
            targetId: id,
            metadata: { active: updated.active },
            request
          },
          tx
        );

        return updated;
      });

      return jsonOk(announcement);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return jsonError('Banner aktif berubah, muat ulang lalu coba lagi.', 409);
      }

      throw error;
    }
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const auth = await requireRole(['ADMIN']);

    if (!auth.ok) {
      return auth.error;
    }

    const { id } = await context.params;

    try {
      await prisma.$transaction(async (tx) => {
        await tx.announcement.delete({ where: { id } });
        await writeAuditLog(
          {
            actorId: auth.user.id,
            action: auditActions.announcementDelete,
            targetType: 'ANNOUNCEMENT',
            targetId: id,
            request
          },
          tx
        );
      });
    } catch (error) {
      // P2025: baris tidak ada (sudah dihapus atau id salah).
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return jsonError('Banner tidak ditemukan.', 404);
      }

      throw error;
    }

    return jsonOk({ id });
  } catch (error) {
    return handleRouteError(error);
  }
}
