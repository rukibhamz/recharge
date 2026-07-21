import { useTenant } from '../../context/TenantContext.jsx';

export default function Logo({ className = '' }) {
  const { brandName } = useTenant();

  return (
    <span className={`font-display text-[1.35rem] font-semibold tracking-tight text-primary ${className}`}>
      {brandName}
    </span>
  );
}
