import type { Metadata } from 'next';
import { AdminAuditLogs } from '@/components/admin/AdminAuditLogs';
import { adminPage, adminParam, type AdminSearchParams } from '@/lib/admin-query';

export const metadata: Metadata = {
  title: 'Audit Log — SILK Admin'
};

export default async function AdminAuditLogsPage({
  searchParams
}: {
  searchParams: Promise<AdminSearchParams>;
}) {
  const params = await searchParams;

  return (
    <AdminAuditLogs
      filters={{
        q: adminParam(params, 'q'),
        targetType: adminParam(params, 'targetType'),
        action: adminParam(params, 'action'),
        from: adminParam(params, 'from'),
        to: adminParam(params, 'to'),
        page: adminPage(params)
      }}
    />
  );
}
