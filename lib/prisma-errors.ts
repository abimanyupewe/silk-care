// `instanceof Prisma.PrismaClientKnownRequestError` gagal di route (kelas dari salinan modul
// lain), jadi P2002 dikenali lewat `code`. Dengan driver adapter, kolomnya tidak ada di
// `meta.target` melainkan di `meta.driverAdapterError.cause`.
export function uniqueViolation(error: unknown): { target: string } | null {
  if (typeof error !== 'object' || error === null) return null;
  if ((error as { code?: unknown }).code !== 'P2002') return null;

  const meta = (error as { meta?: { target?: unknown; driverAdapterError?: { cause?: unknown } } })
    .meta;
  const cause = meta?.driverAdapterError?.cause as
    | { constraint?: { fields?: unknown; index?: unknown }; originalMessage?: unknown }
    | undefined;

  return {
    target: JSON.stringify([meta?.target, cause?.constraint, cause?.originalMessage])
  };
}
