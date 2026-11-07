import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { Inter } from 'next/font/google';
import { ServiceWorkerRegister } from '@/components/shared/ServiceWorkerRegister';
import './globals.css';

const satoshi = localFont({
  src: '../public/assets/fonts/Satoshi-Variable.woff2',
  weight: '300 900',
  style: 'normal',
  variable: '--font-satoshi',
  display: 'swap'
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'SILK',
  description: 'Sistem Informasi Layanan Kesehatan',
  appleWebApp: { capable: true, title: 'SILK' },
  icons: { apple: '/icons/apple-touch-icon.png' }
};

export const viewport: Viewport = {
  themeColor: '#007f6e'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${satoshi.variable} ${inter.variable}`}>
      <body>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
