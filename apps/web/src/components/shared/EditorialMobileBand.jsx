import EditorialArtwork from './EditorialArtwork.jsx';

/**
 * Compact editorial visual for mobile — desktop uses SplitEditorialLayout aside instead.
 */
export default function EditorialMobileBand({
  variant = 'reflection',
  badge,
  title,
  text,
  className = '',
  compact = false,
}) {
  const aspect = compact ? 'aspect-[2.5/1]' : 'aspect-[2.1/1]';

  return (
    <div className={`editorial-mobile-band mb-6 lg:hidden ${className}`}>
      <div className="editorial-frame relative">
        <EditorialArtwork variant={variant} className={`${aspect} w-full`} />
        {badge || title || text ? (
          <div className="glass-panel absolute inset-x-3 bottom-3 p-3 sm:inset-x-4 sm:bottom-4 sm:p-4">
            {badge ? (
              <p className="font-sans text-[10px] font-bold uppercase tracking-[0.1em] text-primary/70">
                {badge}
              </p>
            ) : null}
            {title ? (
              <p className="mt-1 font-display text-lg leading-snug text-primary">{title}</p>
            ) : null}
            {text ? (
              <p className="mt-1 line-clamp-2 font-sans text-body-md leading-snug text-on-surface-variant">
                {text}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
