/**
 * Signature arc motif — incomplete circle (vessel filling / emptying).
 */
export default function ArcIcon({ className = 'h-3.5 w-3.5', stroke = 'currentColor' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 16a8 8 0 1 1 16 0"
        stroke={stroke}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ArcDivider({ className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`} aria-hidden="true">
      <ArcIcon className="h-5 w-5 text-fern" />
      <div className="h-px flex-1 bg-linen-sunken" />
    </div>
  );
}
