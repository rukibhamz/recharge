/** Default white-label landing copy. Businesses override per workspace. */

export const DEFAULT_WORKSPACE_CONTENT = {
  badge: 'Science-informed warmth',
  badgeMobile: 'A science-informed sanctuary',
  headline: 'Are you truly okay?',
  headlineDesktop: 'Are you truly okay, or just managing?',
  supporting:
    'Quiet your mind, look inward, and discover the path back to your most resilient self.',
  supportingDesktop:
    'Two tailored interviews — personality first, then burnout shaped by who you are. Personalised recommendations at the end. No account required.',
  cta: 'Begin Assessment',
  footerTagline: 'Not medical advice. For self-reflection only.',
};

export function sanitizeWorkspaceContent(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const out = { ...DEFAULT_WORKSPACE_CONTENT };
  for (const key of Object.keys(DEFAULT_WORKSPACE_CONTENT)) {
    if (typeof src[key] === 'string' && src[key].trim()) {
      out[key] = src[key].trim().slice(0, 500);
    }
  }
  return out;
}

export function mergeWorkspaceContent(raw) {
  return sanitizeWorkspaceContent(raw);
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function sanitizeSlug(raw) {
  return String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

export function isValidSlug(slug) {
  return SLUG_RE.test(slug) && slug.length >= 2 && slug.length <= 48;
}

export function sanitizeCustomDomain(raw) {
  let host = String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/:\d+$/, '');
  if (!host || host.includes(' ') || host.includes('/') || !host.includes('.')) {
    return '';
  }
  return host.slice(0, 253);
}

export function sanitizePrimaryColor(raw) {
  const c = String(raw ?? '').trim();
  if (/^#[0-9a-fA-F]{6}$/.test(c)) return c.toLowerCase();
  return '#003441';
}
