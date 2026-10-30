// Tanpa import server supaya aman dipakai komponen klien (status, label) maupun route API.
import { z } from 'zod';
import type { Prisma } from '@/lib/generated/prisma';

export const announcementTones = ['INFO', 'PROMO', 'IMPORTANT'] as const;

export type AnnouncementToneValue = (typeof announcementTones)[number];

export const announcementToneLabels: Record<AnnouncementToneValue, string> = {
  INFO: 'Informasi',
  PROMO: 'Promo',
  IMPORTANT: 'Penting'
};

export type AnnouncementStatusValue = 'LIVE' | 'SCHEDULED' | 'ENDED' | 'DRAFT';

export const announcementStatusLabels: Record<AnnouncementStatusValue, string> = {
  LIVE: 'Sedang tampil',
  SCHEDULED: 'Terjadwal',
  ENDED: 'Berakhir',
  DRAFT: 'Draf'
};

// Hanya path internal atau https. Backslash dan spasi/kontrol ditolak: browser menganggap
// `/\evil.com` sama dengan `//evil.com`.
export function isSafeLinkUrl(url: string) {
  if (/[\s\\\u0000-\u001f]/.test(url)) {
    return false;
  }

  if (url.startsWith('/')) {
    return !url.startsWith('//');
  }

  try {
    const parsed = new URL(url);

    return parsed.protocol === 'https:' && parsed.hostname.length > 0;
  } catch {
    return false;
  }
}

// Bagian template yang belum diisi ditandai [ ... ]; banner seperti itu hanya boleh jadi draf.
export function hasPlaceholder(message: string) {
  return /[[\]]/.test(message);
}

const fields = {
  message: z.string().trim().min(1).max(200),
  linkLabel: z.string().trim().min(1).max(40).nullable().optional(),
  linkUrl: z.string().trim().min(1).max(500).nullable().optional(),
  startsAt: z.coerce.date().nullable().optional(),
  endsAt: z.coerce.date().nullable().optional()
};

export const announcementCreateSchema = z.object({
  ...fields,
  tone: z.enum(announcementTones).default('INFO'),
  // Banner baru berupa draf: mengaktifkan menonaktifkan banner lain, jadi harus disengaja.
  active: z.boolean().default(false),
  dismissible: z.boolean().default(true)
});

export const announcementUpdateSchema = z
  .object({
    ...fields,
    message: fields.message.optional(),
    tone: z.enum(announcementTones).optional(),
    active: z.boolean().optional(),
    dismissible: z.boolean().optional()
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Minimal satu field harus diisi.'
  });

export type AnnouncementState = {
  message: string;
  linkLabel: string | null;
  linkUrl: string | null;
  active: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
};

// Dipakai POST dan PATCH terhadap nilai gabungan (baris lama + perubahan).
export function validateAnnouncementState(state: AnnouncementState): string | null {
  if (Boolean(state.linkLabel) !== Boolean(state.linkUrl)) {
    return 'Teks dan alamat tautan harus diisi bersamaan.';
  }

  if (state.linkUrl && !isSafeLinkUrl(state.linkUrl)) {
    return 'Alamat tautan harus berupa path internal (diawali /) atau https://.';
  }

  if (state.startsAt && state.endsAt && state.endsAt.getTime() <= state.startsAt.getTime()) {
    return 'Tanggal selesai harus setelah tanggal mulai.';
  }

  if (state.active && hasPlaceholder(state.message)) {
    return 'Lengkapi bagian dalam [ ] sebelum mengaktifkan banner.';
  }

  return null;
}

// Bentuk respons GET /announcements/active (tanggal sebagai string ISO di sisi klien).
export type PublicAnnouncement = {
  id: string;
  message: string;
  linkLabel: string | null;
  linkUrl: string | null;
  tone: AnnouncementToneValue;
  dismissible: boolean;
  updatedAt: string;
};

export const publicAnnouncementSelect = {
  id: true,
  message: true,
  linkLabel: true,
  linkUrl: true,
  tone: true,
  dismissible: true,
  updatedAt: true
} satisfies Prisma.AnnouncementSelect;

export const announcementSelect = {
  ...publicAnnouncementSelect,
  active: true,
  startsAt: true,
  endsAt: true,
  createdAt: true
} satisfies Prisma.AnnouncementSelect;

export function liveAnnouncementWhere(now: Date): Prisma.AnnouncementWhereInput {
  return {
    active: true,
    AND: [
      { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
      { OR: [{ endsAt: null }, { endsAt: { gt: now } }] }
    ]
  };
}

export function announcementStatus(
  announcement: {
    active: boolean;
    startsAt: string | Date | null;
    endsAt: string | Date | null;
  },
  now = new Date()
): AnnouncementStatusValue {
  if (!announcement.active) return 'DRAFT';
  if (announcement.startsAt && new Date(announcement.startsAt) > now) return 'SCHEDULED';
  if (announcement.endsAt && new Date(announcement.endsAt) <= now) return 'ENDED';

  return 'LIVE';
}
