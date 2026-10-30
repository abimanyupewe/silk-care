import { cn } from '@/lib/utils';
import { SmartImage } from './SmartImage';

const initialsOf = (name: string) =>
  name
    .replace(/^dr\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

// Foto bulat; tanpa foto, tampil inisial nama.
export function Avatar({
  src,
  name,
  size = 72,
  className
}: {
  src: string | null;
  name: string;
  size?: number;
  className?: string;
}) {
  const box = cn('shrink-0 rounded-full border border-border', className);

  if (src) {
    return (
      <SmartImage
        src={src}
        alt={name}
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className={cn(box, 'object-cover')}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size }}
      className={cn(
        box,
        'flex items-center justify-center bg-primary-tint text-base font-semibold text-primary-deep'
      )}
    >
      {initialsOf(name)}
    </span>
  );
}
