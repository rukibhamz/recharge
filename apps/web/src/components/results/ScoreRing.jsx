import { BURNOUT_STATUS_COLORS } from '../../lib/design.js';

export default function ScoreRing({ pct, cls, level }) {
  const radius = 52;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const stroke = BURNOUT_STATUS_COLORS[cls] ?? BURNOUT_STATUS_COLORS.moderate;

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-40 w-40">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#e1e2e4"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
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
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-headline-md font-semibold text-on-surface">{pct}%</span>
        </div>
      </div>
      <p className="mt-4 text-center font-sans text-body-md font-semibold text-on-surface">{level}</p>
    </div>
  );
}
