/** Normalized fields for on-screen ShareCard and PNG export. */
export function normalizeShareCardContent({ displayName, burnout, personality }) {
  const first = displayName?.trim().split(/\s+/)[0] ?? '';
  const type = personality?.type ?? {};
  const rawDesc = type.desc ?? personality?.summary ?? '';
  const typeDesc = rawDesc.length > 160 ? `${rawDesc.slice(0, 157)}…` : rawDesc;

  return {
    first,
    burnoutLevel: burnout?.level ?? '—',
    icon: type.icon ?? '✨',
    typeName: type.name ?? type.title ?? 'Your profile',
    typeDesc,
  };
}
