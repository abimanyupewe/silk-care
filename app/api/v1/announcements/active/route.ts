import { prisma } from '@/lib/db';
import { handleRouteError, jsonOk } from '@/lib/api';
import { liveAnnouncementWhere, publicAnnouncementSelect } from '@/lib/announcement';

// Publik, tanpa autentikasi. Normalnya paling banyak satu baris aktif (indeks unik parsial);
// urutan updatedAt hanya pengaman.
export async function GET() {
  try {
    const announcement = await prisma.announcement.findFirst({
      where: liveAnnouncementWhere(new Date()),
      orderBy: { updatedAt: 'desc' },
      select: publicAnnouncementSelect
    });

    return jsonOk(announcement);
  } catch (error) {
    return handleRouteError(error);
  }
}
