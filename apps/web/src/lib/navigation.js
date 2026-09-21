export function normalizePath(pathname) {
  if (!pathname) return '/';
  const trimmed = pathname.replace(/\/+$/, '') || '/';
  return trimmed;
}

function emitUrlChange() {
  window.dispatchEvent(new Event('recharge:url'));
}

/** In-app navigation (nav links). Pushes history and notifies listeners. */
export function navigate(to, { replace = false } = {}) {
  const target = to.startsWith('/') ? to : `/${to}`;
  if (normalizePath(window.location.pathname) === normalizePath(target)) return;
  if (replace) {
    window.history.replaceState(null, '', target);
  } else {
    window.history.pushState(null, '', target);
  }
  window.dispatchEvent(new PopStateEvent('popstate'));
}

/** Quiet URL sync for assessment phases — updates location without fighting the store. */
export function syncUrl(to) {
  if (typeof window === 'undefined') return;
  const target = to.startsWith('/') ? to : `/${to}`;
  if (normalizePath(window.location.pathname) === normalizePath(target)) return;
  window.history.replaceState(null, '', target);
  emitUrlChange();
}

/** Canonical path for an assessment store phase. */
export function pathForPhase(phase) {
  switch (phase) {
    case 'hero':
      return '/';
    case 'name':
      return '/assess/name';
    case 'profile':
      return '/assess/profile';
    case 'loading-personality-test':
    case 'personality':
    case 'scoring-personality':
      return '/assess/personality';
    case 'personality-insight':
      return '/assess/insight';
    case 'loading-burnout-test':
    case 'burnout':
      return '/assess/burnout';
    case 'recovery-preferences':
      return '/assess/recovery';
    case 'processing':
      return '/assess/processing';
    case 'results':
      return '/results';
    default:
      return null;
  }
}

/** Map a URL path to an assessment phase hint (null = not an assessment URL). */
export function phaseFromAssessPath(pathname) {
  const path = normalizePath(pathname);
  if (path === '/results') return 'results';
  if (path === '/assess' || path === '/assess/start') return 'name';
  if (path === '/assess/name') return 'name';
  if (path === '/assess/profile') return 'profile';
  if (path === '/assess/personality') return 'personality';
  if (path === '/assess/insight') return 'personality-insight';
  if (path === '/assess/burnout') return 'burnout';
  if (path === '/assess/recovery') return 'recovery-preferences';
  if (path === '/assess/processing') return 'processing';
  return null;
}

export function parsePathRoute(pathname) {
  const path = normalizePath(pathname);

  if (path === '/auth/callback') return { kind: 'auth-callback' };
  if (path === '/login') return { kind: 'login' };
  if (path === '/account') return { kind: 'account' };
  if (path === '/admin') return { kind: 'admin' };
  if (path === '/history') return { kind: 'history' };
  if (path === '/about') return { kind: 'about' };
  if (path === '/faq') return { kind: 'faq' };
  if (path === '/feedback') return { kind: 'feedback' };
  if (path === '/privacy') return { kind: 'legal', legal: 'privacy' };
  if (path === '/terms') return { kind: 'legal', legal: 'terms' };
  if (path === '/security') return { kind: 'legal', legal: 'security' };

  const historyMatch = path.match(/^\/history\/([0-9a-f-]{36})$/i);
  if (historyMatch) return { kind: 'history-detail', sessionId: historyMatch[1] };

  const shareMatch = path.match(/^\/share\/([a-f0-9]{32})$/i);
  if (shareMatch) return { kind: 'share', shareToken: shareMatch[1] };

  const assessPhase = phaseFromAssessPath(path);
  if (assessPhase) {
    return { kind: 'app', assessPhase };
  }

  return { kind: 'app', assessPhase: null };
}
