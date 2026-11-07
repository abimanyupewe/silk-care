import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SILK — Sistem Informasi Layanan Kesehatan',
    short_name: 'SILK',
    description: 'Sistem Informasi Layanan Kesehatan',
    lang: 'id',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#007f6e',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' }
    ]
  };
}
