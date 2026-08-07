import Logo from './Logo.jsx';
import { useTenant } from '../../context/TenantContext.jsx';

export default function Footer({ compact = false }) {
  const { brandName, content, isWhiteLabel } = useTenant();

  return (
    <div className={`mt-auto px-margin-mobile sm:px-8 lg:px-12 ${compact ? 'pb-6 pt-8' : 'pb-8 pt-12'}`}>
      <footer className="floating-bar mx-auto flex max-w-landing flex-col items-center justify-between gap-6 rounded-t-3xl px-6 py-8 md:flex-row md:items-center md:px-8">
        <div className="flex flex-col items-center gap-2 md:items-start">
          <Logo className="opacity-80" />
          {content.footerTagline ? (
            <p className="max-w-md text-center font-sans text-body-md text-on-surface-variant md:text-left">
              {content.footerTagline}
            </p>
          ) : null}
          <p className="font-sans text-[12px] text-on-surface-variant/70">
            © {new Date().getFullYear()} {brandName}
            {isWhiteLabel ? ' · Powered by Recharge' : '. Confidential & Proprietary'}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 font-sans text-sm font-medium text-on-surface-variant">
          <a href="/privacy" className="transition hover:text-primary">
            Privacy Policy
          </a>
          <a href="/terms" className="transition hover:text-primary">
            Terms of Service
          </a>
          {!compact && (
            <a href="/security" className="transition hover:text-primary">
              Data Security
            </a>
          )}
        </div>
      </footer>
    </div>
  );
}
