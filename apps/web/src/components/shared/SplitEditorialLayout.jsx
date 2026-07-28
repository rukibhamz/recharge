import EditorialArtwork from './EditorialArtwork.jsx';
import EditorialMobileBand from './EditorialMobileBand.jsx';

/**
 * Two-column layout: primary content + editorial visual (desktop).
 * Mobile shows a compact artwork band above content.
 */
export default function SplitEditorialLayout({
  children,
  artworkVariant = 'reflection',
  asideTitle,
  asideText,
  asideBadge,
  mobileCompact = false,
  className = '',
  contentClassName = '',
}) {
  return (
    <div className={`grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start ${className}`}>
      <div className={contentClassName}>
        <EditorialMobileBand
          variant={artworkVariant}
          badge={asideBadge}
          title={asideTitle}
          text={asideText}
          compact={mobileCompact}
        />
        {children}
      </div>
      <aside className="hidden lg:block">
        <div className="glass-card sticky top-8 p-5">
          <EditorialArtwork variant={artworkVariant} className="aspect-[4/4.2] w-full" />
          {asideBadge || asideTitle || asideText ? (
            <div className="px-1 pb-1 pt-5">
              {asideBadge ? (
                <p className="font-sans text-label-sm uppercase tracking-[0.08em] text-primary/70">
                  {asideBadge}
                </p>
              ) : null}
              {asideTitle ? (
                <p className="mt-2 font-display text-headline-md text-primary">{asideTitle}</p>
              ) : null}
              {asideText ? (
                <p className="mt-3 font-sans text-body-md leading-relaxed text-on-surface-variant">
                  {asideText}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
