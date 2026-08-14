export function normalizePath(pathname) {
  if (!pathname) return '/';
  const trimmed = pathname.replace(/\/+$/, '') || '/';
  return trimmed;
}

export function navigate(to) {
  const target = to.startsWith('/') ? to : `/${to}`;
  if (normalizePath(window.location.pathname) === normalizePath(target)) return;
  window.history.pushState(null, '', target);
  window.dispatchEvent(new PopStateEvent('popstate'));
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

  return { kind: 'app' };
}
