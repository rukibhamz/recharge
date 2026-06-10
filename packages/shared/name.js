export function sanitizeName(name) {
  return String(name ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 80);
}

export function firstName(name) {
  const clean = sanitizeName(name);
  if (!clean) return null;
  return clean.split(' ')[0];
}

export function isValidName(name) {
  const clean = sanitizeName(name);
  return clean.length >= 1 && clean.length <= 80;
}
