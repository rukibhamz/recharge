function normalizeEmail(email) {
  return String(email ?? '')
    .trim()
    .toLowerCase();
}

/** Comma-separated admin emails from ADMIN_EMAILS env. */
export function adminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(normalizeEmail)
    .filter(Boolean);
}

export function isAdminEmail(email) {
  const list = adminEmails();
  if (!list.length) return false;
  return list.includes(normalizeEmail(email));
}

export function isAdminConfigured() {
  return adminEmails().length > 0;
}
