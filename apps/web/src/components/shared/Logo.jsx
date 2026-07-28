import { useTenant } from '../../context/TenantContext.jsx';
import ArcIcon from './Arc.jsx';

export default function Logo({ className = '' }) {
  const { brandName } = useTenant();

  return (
    <span
      className={`inline-flex items-center gap-2 font-display text-[1.35rem] font-normal tracking-tight text-ink ${className}`}
    >
      <ArcIcon className="h-4 w-4 text-fern" />
      {brandName}
    </span>
  );
}
