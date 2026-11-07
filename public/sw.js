// Service worker minimal: hanya agar aplikasi bisa di-install, tanpa cache/offline.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
