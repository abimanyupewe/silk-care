import type { Prisma } from '@/lib/generated/prisma';
import { prisma } from '@/lib/db';
import { getClientIp } from '@/lib/api';
import { logError } from '@/lib/logger';

export const auditActions = {
  userCreate: 'USER_CREATE',
  userUpdate: 'USER_UPDATE',
  userDelete: 'USER_DELETE',
  userRestore: 'USER_RESTORE',
  doctorUpdate: 'DOCTOR_UPDATE',
  doctorVerification: 'DOCTOR_VERIFICATION',
  facilityCreate: 'FACILITY_CREATE',
  facilityUpdate: 'FACILITY_UPDATE',
  facilityVerification: 'FACILITY_VERIFICATION',
  articleUpdate: 'ARTICLE_UPDATE',
  articleDelete: 'ARTICLE_DELETE',
  articleModerate: 'ARTICLE_MODERATE',
  articleRestore: 'ARTICLE_RESTORE',
  orderStatusUpdate: 'ORDER_STATUS_UPDATE',
  reviewModerate: 'REVIEW_MODERATE',
  reviewDelete: 'REVIEW_DELETE',
  notificationBroadcast: 'NOTIFICATION_BROADCAST',
  // Aktivitas yang dilakukan pengguna sendiri.
  userRegister: 'USER_REGISTER',
  userLogin: 'USER_LOGIN',
  userPasswordChange: 'USER_PASSWORD_CHANGE',
  orderCreate: 'ORDER_CREATE',
  orderCancel: 'ORDER_CANCEL',
  consultationCreate: 'CONSULTATION_CREATE',
  consultationCancel: 'CONSULTATION_CANCEL',
  reviewCreate: 'REVIEW_CREATE'
} as const;

export const auditTargetTypes = [
  'USER',
  'DOCTOR',
  'FACILITY',
  'ARTICLE',
  'ORDER',
  'REVIEW',
  'NOTIFICATION',
  'CONSULTATION'
] as const;

export type AuditAction = (typeof auditActions)[keyof typeof auditActions];
export type AuditTargetType = (typeof auditTargetTypes)[number];

type AuditLogInput = {
  actorId: string;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId?: string | null;
  metadata?: Prisma.InputJsonValue;
  request?: Request;
};

export async function writeAuditLog(input: AuditLogInput, tx?: Prisma.TransactionClient) {
  const db = tx ?? prisma;
  const userAgent = input.request?.headers.get('user-agent')?.slice(0, 500) || null;

  await db.auditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
      metadata: input.metadata,
      ipAddress: input.request ? getClientIp(input.request) : null,
      userAgent
    }
  });
}

// Untuk aktivitas di luar transaksi: gagal mencatat tidak boleh menggagalkan aksi pengguna.
export async function recordActivity(input: AuditLogInput) {
  try {
    await writeAuditLog(input);
  } catch (error) {
    logError('audit.activity_failed', error, { action: input.action, actorId: input.actorId });
  }
}
