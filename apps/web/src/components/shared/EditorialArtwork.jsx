export default function EditorialArtwork({
  variant = 'hero',
  className = '',
}) {
  if (variant === 'recovery') {
    return (
      <div
        className={`relative overflow-hidden rounded-xl bg-secondary-container/40 ${className}`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 520 420" className="h-full w-full">
          <rect width="520" height="420" fill="rgba(255,255,255,0.2)" />
          <circle cx="116" cy="102" r="84" fill="rgba(154,206,225,0.55)" />
          <circle cx="385" cy="96" r="116" fill="rgba(255,220,190,0.72)" />
          <circle cx="424" cy="322" r="96" fill="rgba(135,187,206,0.48)" />
          <path
            d="M104 286C142 216 217 182 287 190C358 198 406 241 438 302"
            fill="none"
            stroke="rgba(0,52,65,0.24)"
            strokeWidth="28"
            strokeLinecap="round"
          />
          <path
            d="M98 238C141 181 204 153 262 155C333 158 398 205 435 262"
            fill="none"
            stroke="rgba(15,76,92,0.14)"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <circle cx="224" cy="214" r="26" fill="rgba(255,255,255,0.88)" />
          <circle cx="304" cy="234" r="18" fill="rgba(255,255,255,0.7)" />
          <circle cx="350" cy="188" r="12" fill="rgba(255,255,255,0.58)" />
        </svg>
      </div>
    );
  }

  if (variant === 'reflection') {
    return (
      <div
        className={`relative overflow-hidden rounded-xl bg-surface-soft ${className}`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 520 420" className="h-full w-full">
          <rect width="520" height="420" fill="rgba(255,255,255,0.45)" />
          <ellipse cx="164" cy="116" rx="126" ry="90" fill="rgba(255,220,190,0.9)" />
          <ellipse cx="372" cy="132" rx="122" ry="98" fill="rgba(154,206,225,0.72)" />
          <ellipse cx="264" cy="290" rx="200" ry="118" fill="rgba(212,230,229,0.8)" />
          <path
            d="M175 268C210 222 254 198 303 186C333 178 365 176 397 178"
            fill="none"
            stroke="rgba(0,52,65,0.24)"
            strokeWidth="20"
            strokeLinecap="round"
          />
          <path
            d="M140 302C196 333 266 340 327 322"
            fill="none"
            stroke="rgba(15,76,92,0.18)"
            strokeWidth="16"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-surface-soft ${className}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 760 520" className="h-full w-full">
        <rect width="760" height="520" fill="rgba(255,255,255,0.35)" />
        <circle cx="132" cy="128" r="112" fill="rgba(255,220,190,0.78)" />
        <circle cx="588" cy="122" r="138" fill="rgba(154,206,225,0.8)" />
        <circle cx="394" cy="420" r="150" fill="rgba(212,230,229,0.92)" />
        <path
          d="M96 364C180 280 286 232 404 232C504 232 593 271 665 341"
          fill="none"
          stroke="rgba(0,52,65,0.24)"
          strokeWidth="36"
          strokeLinecap="round"
        />
        <path
          d="M148 396C234 333 334 309 442 316C518 320 583 343 640 381"
          fill="none"
          stroke="rgba(15,76,92,0.12)"
          strokeWidth="18"
          strokeLinecap="round"
        />
        <circle cx="292" cy="204" r="28" fill="rgba(255,255,255,0.88)" />
        <circle cx="352" cy="172" r="18" fill="rgba(255,255,255,0.7)" />
        <circle cx="414" cy="204" r="22" fill="rgba(255,255,255,0.78)" />
      </svg>
    </div>
  );
}
