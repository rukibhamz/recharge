import { normalizeShareCardContent } from '../../lib/shareCardContent.js';

const C = {
  linen: '#F6F2E9',
  canopy: '#2D6A4F',
  ink: '#16231C',
  inkSoft: '#4A554D',
  white: '#FFFFFF',
  sunken: '#EDE7D9',
  shadow: '0 1px 3px rgba(22, 35, 28, 0.08)',
};

export default function ShareCard({ displayName, burnout, personality }) {
  const { first, burnoutLevel, icon, typeName, typeDesc } = normalizeShareCardContent({
    displayName,
    burnout,
    personality,
  });

  return (
    <div
      id="share-card"
      style={{
        width: 400,
        boxSizing: 'border-box',
        overflow: 'hidden',
        borderRadius: 14,
        backgroundColor: C.linen,
        color: C.ink,
        padding: 32,
        fontFamily: '"Public Sans", system-ui, sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p
          style={{
            margin: 0,
            fontFamily: 'Fraunces, Georgia, serif',
            fontSize: 20,
            fontWeight: 400,
            color: C.ink,
          }}
        >
          Recharge
        </p>
        <p
          style={{
            margin: 0,
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: 11,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: C.inkSoft,
          }}
        >
          Profile
        </p>
      </div>

      {first ? (
        <p style={{ margin: '24px 0 0', fontSize: 16, color: C.inkSoft }}>
          {first}&apos;s snapshot
        </p>
      ) : null}

      <div
        style={{
          marginTop: 16,
          borderRadius: 14,
          border: `1px solid ${C.sunken}`,
          backgroundColor: C.white,
          padding: 20,
          boxShadow: C.shadow,
        }}
      >
        <p
          style={{
            margin: 0,
            textAlign: 'center',
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: 11,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: C.inkSoft,
          }}
        >
          Burnout check
        </p>
        <p
          style={{
            margin: '8px 0 0',
            textAlign: 'center',
            fontFamily: 'Fraunces, Georgia, serif',
            fontSize: 22,
            fontWeight: 400,
            color: C.canopy,
          }}
        >
          {burnoutLevel}
        </p>
      </div>

      <div
        style={{
          marginTop: 16,
          borderRadius: 14,
          border: `1px solid ${C.sunken}`,
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
                fontFamily: 'Fraunces, Georgia, serif',
                fontSize: 18,
                fontWeight: 400,
                color: C.ink,
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
                  color: C.inkSoft,
                }}
              >
                {typeDesc}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <p
        style={{
          margin: '24px 0 0',
          textAlign: 'center',
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: 11,
          color: C.inkSoft,
        }}
      >
        recharge.app · Not medical advice
      </p>
    </div>
  );
}
