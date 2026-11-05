import { isPartnerType } from './partner-requirements/types';

// Peta peran -> halaman panel. Murni (tanpa import server) agar dipakai juga oleh form login.
export type AppRole = 'ADMIN' | 'DOCTOR' | 'FACILITY' | 'PHARMACY' | 'PATIENT';

export function panelHomeForRole(role: AppRole | string | null | undefined) {
  if (role === 'ADMIN') return '/admin';
  if (role === 'DOCTOR') return '/dashboard/dokter';
  if (role === 'FACILITY' || role === 'PHARMACY') return '/dashboard/fasilitas';

  // Pasien belum punya panel; kembali ke situs publik.
  return '/';
}

// Satu-satunya tujuan di luar panel (pendaftaran mitra); kecocokan persis, bukan prefix.
// /mitra/fasilitas dipertahankan untuk tautan lama.
export function isPartnerSignUpUrl(url: string | null | undefined): boolean {
  if (!url) return false;

  for (const base of ['/mitra/daftar', '/mitra/fasilitas']) {
    if (url === base) return true;
    if (url.startsWith(`${base}?type=`) && isPartnerType(url.slice(base.length + 6))) return true;
  }

  return false;
}

// callbackUrl hanya dipakai jika berada di panel milik peran tersebut; selain itu ke beranda
// panel. Mencegah open redirect dan pengalihan ke panel peran lain.
export function safeCallbackUrl(
  callbackUrl: string | null | undefined,
  role: string | null | undefined
) {
  if (callbackUrl && isPartnerSignUpUrl(callbackUrl)) {
    return callbackUrl;
  }

  const home = panelHomeForRole(role);

  if (home === '/' || !callbackUrl) {
    return home;
  }

  const inPanel =
    callbackUrl === home ||
    callbackUrl.startsWith(`${home}/`) ||
    callbackUrl.startsWith(`${home}?`);

  return inPanel ? callbackUrl : home;
}
