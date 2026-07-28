import { BURNOUT_STATUS_COLORS } from '../../lib/design.js';

/** Signature score arc — incomplete circle motif from design system */
export default function ScoreRing({ pct, cls, level }) {
  const radius = 46;
  const strokeWidth = 9;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const stroke = BURNOUT_STATUS_COLORS[cls] ?? BURNOUT_STATUS_COLORS.moderate;

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-[110px] w-[110px]">
        <svg className="h-full w-full" viewBox="0 0 120 120" aria-hidden="true">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#EDE7D9"
            strokeWidth={strokeWidth}
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 60 60)"
            style={{ transition: 'stroke-dashoffset 1200ms cubic-bezier(0.4, 0, 0.2, 1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-[22px] font-medium text-ink">{pct}%</span>
        </div>
      </div>
      {level ? (
        <p className="mt-3 text-center font-mono text-[11px] uppercase tracking-[0.06em] text-ink-faint">
          {level}
        </p>
      ) : null}
    </div>
  );
}
