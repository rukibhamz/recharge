import LoadingDots from './LoadingDots.jsx';
import EditorialArtwork from './EditorialArtwork.jsx';
import EditorialMobileBand from './EditorialMobileBand.jsx';

export default function PageLoadingState({
  message = 'Loading…',
  artworkVariant = 'reflection',
  bandTitle,
  bandText,
}) {
  return (
    <div className="mx-auto flex max-w-landing flex-1 items-center px-margin-mobile py-12 sm:px-8 lg:px-12">
      <div className="grid w-full gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="flex w-full flex-col items-center text-center lg:items-start lg:text-left">
          <EditorialMobileBand
            variant={artworkVariant}
            title={bandTitle}
            text={bandText}
            compact
            className="w-full"
          />
          <LoadingDots />
          <p className="mt-8 font-sans text-body-md text-on-surface-variant">{message}</p>
        </div>
        <div className="glass-card hidden p-5 lg:block">
          <EditorialArtwork variant={artworkVariant} className="aspect-[1.1/1] w-full" />
        </div>
      </div>
    </div>
  );
}
