import { BURNOUT_STATUS_COLORS } from '../../lib/design.js';

/** Signature score arc — incomplete circle motif from design system */
export default function ScoreRing({ pct, cls, level, size = 'md', showRiskLabel = false }) {
  const isLg = size === 'lg';
  const radius = isLg ? 42 : 46;
  const strokeWidth = isLg ? 8 : 9;
  const circumference = 2 * Math.PI * radius;
  const safePct = Math.min(100, Math.max(0, Number(pct) || 0));
  const offset = circumference - (safePct / 100) * circumference;
  const stroke = BURNOUT_STATUS_COLORS[cls] ?? BURNOUT_STATUS_COLORS.moderate;
  const track = isLg ? 'rgba(255,255,255,0.45)' : '#EDE7D9';
  const box = isLg ? 'h-52 w-52' : 'h-[110px] w-[110px]';
  const view = isLg ? 100 : 120;
  const cx = isLg ? 50 : 60;

  return (
    <div className="flex flex-col items-center">
      <div className={`relative ${box}`}>
        <svg className="h-full w-full" viewBox={`0 0 ${view} ${view}`} aria-hidden="true">
          <circle
            cx={cx}
            cy={cx}
            r={radius}
            fill="none"
            stroke={track}
            strokeWidth={strokeWidth}
          />
          <circle
            cx={cx}
            cy={cx}
            r={radius}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${cx} ${cx})`}
            style={{ transition: 'stroke-dashoffset 1200ms cubic-bezier(0.4, 0, 0.2, 1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={
              isLg
                ? 'font-display text-5xl font-medium tracking-tight text-canopy'
                : 'font-mono text-[22px] font-medium text-ink'
            }
          >
            {Math.round(safePct)}%
          </span>
          {showRiskLabel ? (
            <span className="mt-1 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-canopy/70">
              Risk
            </span>
          ) : null}
        </div>
      </div>
      {level && !showRiskLabel ? (
        <p className="mt-3 text-center font-mono text-[11px] uppercase tracking-[0.06em] text-ink-faint">
          {level}
        </p>
      ) : null}
    </div>
  );
}
