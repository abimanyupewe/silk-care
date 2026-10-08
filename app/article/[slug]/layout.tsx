import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SILK',
  description: 'Sistem Informasi Layanan Kesehatan'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
