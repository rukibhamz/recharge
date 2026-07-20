/** Capture-safe layout: inline hex colors (html2canvas / export libs miss some Tailwind tokens). */
const C = {
  warm: '#FAF9F6',
  primary: '#003441',
  onSurface: '#191c1d',
  onSurfaceVariant: '#40484b',
  white: '#ffffff',
  shadow: '0 8px 30px rgba(0, 52, 65, 0.06)',
};

export default function ShareCard({ displayName, burnout, personality }) {
  const first = displayName?.trim().split(/\s+/)[0];
  const type = personality?.type ?? {};
  const icon = type.icon ?? '✨';
  const typeName = type.name ?? type.title ?? 'Your profile';
  const typeDesc = type.desc ?? '';

  return (
    <div
      id="share-card"
      style={{
        width: 400,
        boxSizing: 'border-box',
        overflow: 'hidden',
        borderRadius: 16,
        backgroundColor: C.warm,
        color: C.onSurface,
        padding: 32,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p
          style={{
            margin: 0,
            fontFamily: 'Outfit, system-ui, sans-serif',
            fontSize: 18,
            fontWeight: 600,
            color: C.primary,
          }}
        >
          Recharge
        </p>
        <p
          style={{
            margin: 0,
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: C.onSurfaceVariant,
          }}
        >
          Profile
        </p>
      </div>

      {first ? (
        <p style={{ margin: '24px 0 0', fontSize: 16, color: C.onSurfaceVariant }}>
          {first}&apos;s snapshot
        </p>
      ) : null}

      <div
        style={{
          marginTop: 16,
          borderRadius: 12,
          backgroundColor: C.white,
          padding: 20,
          boxShadow: C.shadow,
        }}
      >
        <p
          style={{
            margin: 0,
            textAlign: 'center',
            fontSize: 13,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: C.onSurfaceVariant,
          }}
        >
          Burnout check
        </p>
        <p
          style={{
            margin: '8px 0 0',
            textAlign: 'center',
            fontFamily: 'Outfit, system-ui, sans-serif',
            fontSize: 20,
            color: C.primary,
          }}
        >
          {burnout?.level ?? '—'}
        </p>
      </div>

      <div
        style={{
          marginTop: 16,
          borderRadius: 12,
          backgroundColor: C.white,
          padding: 20,
          boxShadow: C.shadow,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <span style={{ fontSize: 28, lineHeight: 1 }} aria-hidden="true">
            {icon}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontFamily: 'Outfit, system-ui, sans-serif',
                fontSize: 18,
                color: C.onSurface,
              }}
            >
              {typeName}
            </p>
            {typeDesc ? (
              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: 14,
                  lineHeight: 1.5,
                  color: C.onSurfaceVariant,
                }}
              >
                {typeDesc.length > 140 ? `${typeDesc.slice(0, 137)}…` : typeDesc}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <p
        style={{
          margin: '24px 0 0',
          textAlign: 'center',
          fontSize: 11,
          color: C.onSurfaceVariant,
        }}
      >
        recharge.app · Not medical advice
      </p>
    </div>
  );
}
