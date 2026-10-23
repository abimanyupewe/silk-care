export function mediaPairError(url?: string | null, publicId?: string | null) {
  if ((url === undefined) !== (publicId === undefined)) {
    return 'URL dan publicId media harus dikirim bersamaan.';
  }

  if ((url === null) !== (publicId === null)) {
    return 'URL dan publicId media harus dihapus bersamaan.';
  }

  return null;
}
