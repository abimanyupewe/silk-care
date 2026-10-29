import type { Metadata } from 'next';
import { AdminEmailTemplates } from '@/components/admin/AdminEmailTemplates';

export const metadata: Metadata = {
  title: 'Template Email — SILK Admin'
};

export default function AdminEmailTemplatesPage() {
  return <AdminEmailTemplates />;
}
