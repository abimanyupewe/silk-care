import Image, { type ImageProps } from 'next/image';

// next/image menolak host yang tidak terdaftar di next.config dan merusak seluruh halaman. Gambar
// dari mitra berupa URL bebas (mis. Product.image), jadi yang bukan path lokal dirender tanpa
// optimasi; path lokal tetap dioptimasi.
export function SmartImage(props: ImageProps) {
  const external = typeof props.src === 'string' && !props.src.startsWith('/');

  // eslint-disable-next-line jsx-a11y/alt-text -- alt diteruskan lewat props
  return <Image {...props} unoptimized={external || props.unoptimized} />;
}
