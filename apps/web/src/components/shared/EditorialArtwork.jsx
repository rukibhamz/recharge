const ARTWORK = {
  hero: {
    src: '/images/hero.jpg',
    alt: 'Person resting quietly in soft morning light',
  },
  reflection: {
    src: '/images/reflection.jpg',
    alt: 'Sunlit forest canopy — quiet green space',
  },
  recovery: {
    src: '/images/recovery.jpg',
    alt: 'Calm natural landscape at golden hour',
  },
};

/**
 * Full-bleed photographic artwork for editorial layouts.
 * Variants map to brand moments: hero, reflection, recovery.
 */
export default function EditorialArtwork({
  variant = 'hero',
  className = '',
  alt,
}) {
  const art = ARTWORK[variant] ?? ARTWORK.hero;
  const hasAspect = /\baspect-/.test(className);

  return (
    <div
      className={`relative overflow-hidden rounded-md bg-linen-sunken ${hasAspect ? '' : 'aspect-[4/3]'} ${className}`}
    >
      <img
        src={art.src}
        alt={alt ?? art.alt}
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
        decoding="async"
      />
      {/* Soft linen wash so photos sit with the design system, not as stark stock */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-canopy/25 via-transparent to-linen/20"
        aria-hidden="true"
      />
    </div>
  );
}
