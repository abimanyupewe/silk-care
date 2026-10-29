// Peta peran -> halaman panel. Murni (tanpa import server) agar dipakai juga oleh form login.
export type AppRole = 'ADMIN' | 'DOCTOR' | 'FACILITY' | 'PHARMACY' | 'PATIENT';

export function panelHomeForRole(role: AppRole | string | null | undefined) {
  if (role === 'ADMIN') return '/admin';
  if (role === 'DOCTOR') return '/dashboard/dokter';
  if (role === 'FACILITY' || role === 'PHARMACY') return '/dashboard/fasilitas';

  // Pasien belum punya panel; kembali ke situs publik.
  return '/';
}

// callbackUrl hanya dipakai jika berada di panel milik peran tersebut; selain itu ke beranda
// panel. Mencegah open redirect dan pengalihan ke panel peran lain.
export function safeCallbackUrl(
  callbackUrl: string | null | undefined,
  role: string | null | undefined
) {
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
