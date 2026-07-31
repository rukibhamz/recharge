import { useCallback, useEffect, useRef } from 'react';

/** Re-run loader when the tab becomes visible or the window gains focus. */
export function useRefreshOnFocus(loader, enabled = true) {
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const run = useCallback(() => {
    if (!enabled) return;
    loaderRef.current?.();
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return undefined;

    const onVisible = () => {
      if (document.visibilityState === 'visible') run();
    };

    window.addEventListener('focus', run);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', run);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [enabled, run]);
}
