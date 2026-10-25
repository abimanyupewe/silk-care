import type { Prisma } from '@/lib/generated/prisma';
import { prisma } from '@/lib/db';
import { getClientIp } from '@/lib/api';

export const auditActions = {
  userUpdate: 'USER_UPDATE',
  userDelete: 'USER_DELETE',
  userRestore: 'USER_RESTORE',
  doctorUpdate: 'DOCTOR_UPDATE',
  doctorVerification: 'DOCTOR_VERIFICATION',
  facilityUpdate: 'FACILITY_UPDATE',
  facilityVerification: 'FACILITY_VERIFICATION',
  articleUpdate: 'ARTICLE_UPDATE',
  articleDelete: 'ARTICLE_DELETE',
  articleModerate: 'ARTICLE_MODERATE',
  articleRestore: 'ARTICLE_RESTORE',
  orderStatusUpdate: 'ORDER_STATUS_UPDATE',
  reviewModerate: 'REVIEW_MODERATE',
  reviewDelete: 'REVIEW_DELETE',
  notificationBroadcast: 'NOTIFICATION_BROADCAST'
} as const;

export const auditTargetTypes = [
  'USER',
  'DOCTOR',
  'FACILITY',
  'ARTICLE',
  'ORDER',
  'REVIEW',
  'NOTIFICATION'
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
