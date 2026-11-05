// Skema body untuk route admin. Dipisah dari lib/announcement.ts karena zod tidak boleh ikut
// terbawa ke bundel klien (banner dan label dipakai di setiap halaman publik).
import { z } from 'zod';
import { announcementTones } from '@/lib/announcement';

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
