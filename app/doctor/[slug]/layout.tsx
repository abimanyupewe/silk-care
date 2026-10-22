import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SILK',
  description: 'Sistem Informasi Layanan Kesehatan'
};

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
