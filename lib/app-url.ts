export function getAppUrl() {
  const url =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.AUTH_URL?.trim() ||
    'http://localhost:3000';

  return url.replace(/\/+$/, '');
}
