import { useCallback, useEffect, useRef } from 'react';

/**
 * Re-run loader when the document returns from a hidden tab.
 * Does not listen to window focus (that fires too often while working in-page).
 */
export function useRefreshOnFocus(loader, enabled = true) {
  const loaderRef = useRef(loader);
  loaderRef.current = loader;
  const wasHiddenRef = useRef(document.visibilityState === 'hidden');
  const lastRunRef = useRef(0);

  const run = useCallback(() => {
    if (!enabled) return;
    const now = Date.now();
    if (now - lastRunRef.current < 5000) return;
    lastRunRef.current = now;
    loaderRef.current?.();
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return undefined;

    const onVisible = () => {
      if (document.visibilityState === 'hidden') {
        wasHiddenRef.current = true;
        return;
      }
      if (document.visibilityState === 'visible' && wasHiddenRef.current) {
        wasHiddenRef.current = false;
        run();
      }
    };

    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [enabled, run]);
}
