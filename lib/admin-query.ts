export type AdminSearchParams = Record<string, string | string[] | undefined>;

export function adminParam(params: AdminSearchParams, key: string) {
  const value = params[key];

  if (Array.isArray(value)) {
    return value[0]?.trim() ?? '';
  }

  return value?.trim() ?? '';
}

export function adminPage(params: AdminSearchParams) {
  const parsed = Number.parseInt(adminParam(params, 'page'), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}
