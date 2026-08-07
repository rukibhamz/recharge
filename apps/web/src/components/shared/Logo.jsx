import { useTenant } from '../../context/TenantContext.jsx';

const LOGO_SRC = '/recharge-logo.png?v=4';
const MARK_SRC = '/favicon.png?v=2';

/**
 * Brand mark — full logo artwork (transparent PNG).
 * @param {'default' | 'compact'} [variant]
 */
export default function Logo({ className = '', variant = 'default' }) {
  const { brandName } = useTenant();
  // Stacked logo (mark + wordmark) needs taller slot than wide wordmarks
  const sizeClass =
    variant === 'compact'
      ? 'h-[5.5rem] w-auto max-w-[11rem] sm:h-24 sm:max-w-[12.5rem]'
      : 'h-20 w-auto max-w-[11rem] sm:h-24 sm:max-w-[13rem]';

  return (
    <span className={`inline-flex items-center ${className}`}>
      <img
        src={LOGO_SRC}
        alt={brandName || 'recharge'}
        className={`${sizeClass} object-contain object-left`}
        decoding="async"
      />
    </span>
  );
}

/** Circular mark for tight spaces (sidebar collapsed). */
export function LogoMark({ className = '', title }) {
  const { brandName } = useTenant();
  return (
    <img
      src={MARK_SRC}
      alt=""
      title={title || brandName || 'recharge'}
      className={`h-10 w-10 object-contain object-center ${className}`}
      decoding="async"
      aria-hidden={title ? undefined : true}
    />
  );
}
