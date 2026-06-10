import Logo from './Logo.jsx';

export default function Footer({ compact = false }) {
  return (
    <footer
      className={`mt-auto border-t border-outline-variant/40 bg-warm ${compact ? 'py-8' : 'py-12'}`}
    >
      <div className="mx-auto max-w-landing px-margin-mobile text-center sm:px-8 lg:px-12">
        <Logo className="inline-block" />
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 font-sans text-body-md text-on-surface-variant">
          <a href="#" className="transition hover:text-primary">
            Privacy Policy
          </a>
          <a href="#" className="transition hover:text-primary">
            Terms of Service
          </a>
          {!compact && (
            <a href="#" className="transition hover:text-primary">
              Data Security
            </a>
          )}
        </div>
        <p className="mt-4 font-sans text-[12px] text-on-surface-variant/60">
          © Recharge. Confidential & Proprietary
        </p>
      </div>
    </footer>
  );
}
