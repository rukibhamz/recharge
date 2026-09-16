import Logo from './Logo.jsx';
import { useTenant } from '../../context/TenantContext.jsx';

export default function Footer({ compact = false }) {
  const { brandName, content, isWhiteLabel } = useTenant();

  return (
    <div className={`mt-auto px-margin-mobile sm:px-8 lg:px-12 ${compact ? 'pb-6 pt-8' : 'pb-8 pt-12'}`}>
      <footer className="floating-bar mx-auto flex max-w-landing flex-col items-center gap-4 rounded-t-3xl px-6 py-8 text-center md:px-8">
        <Logo className="opacity-80" />
        {content.footerTagline ? (
          <p className="max-w-md font-sans text-body-md text-on-surface-variant">
            {content.footerTagline}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 font-sans text-sm font-medium text-on-surface-variant">
          <a href="/about" className="transition hover:text-primary">
            About
          </a>
          <a href="/faq" className="transition hover:text-primary">
            FAQ
          </a>
          <a href="/feedback" className="transition hover:text-primary">
            Feedback
          </a>
          <a href="/privacy" className="transition hover:text-primary">
            Privacy
          </a>
          <a href="/terms" className="transition hover:text-primary">
            Terms
          </a>
          {!compact ? (
            <a href="/security" className="transition hover:text-primary">
              Security
            </a>
          ) : null}
        </div>
        <p className="font-sans text-[12px] text-on-surface-variant/70">
          © {new Date().getFullYear()} {brandName}
          {isWhiteLabel ? ' · Powered by Recharge' : ''}
        </p>
        {!isWhiteLabel ? (
          <p className="font-sans text-[12px] text-on-surface-variant/70">
            Questions?{' '}
            <a href="/feedback" className="underline underline-offset-2 hover:text-primary">
              Send feedback
            </a>
            {' · '}
            <a
              href="mailto:recharge@thedigitalerrand.com"
              className="underline underline-offset-2 hover:text-primary"
            >
              recharge@thedigitalerrand.com
            </a>
          </p>
        ) : null}
      </footer>
    </div>
  );
}
