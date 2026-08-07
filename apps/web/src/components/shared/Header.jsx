import Logo from './Logo.jsx';
import NavLink from './NavLink.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useIsAdmin } from '../../hooks/useIsAdmin.js';

const navLinkClass =
  'btn-interactive font-sans text-sm font-medium text-on-surface transition-colors hover:text-primary';

function AccountNav() {
  const { user, loading, isConfigured } = useAuth();
  const { isAdmin } = useIsAdmin();

  if (!isConfigured || loading) return null;

  if (user) {
    return (
      <div className="flex items-center gap-6">
        {isAdmin ? (
          <NavLink href="/admin" className={`hidden sm:inline ${navLinkClass}`}>
            Admin
          </NavLink>
        ) : null}
        <NavLink href="/account" className={`hidden sm:inline ${navLinkClass}`}>
          Account
        </NavLink>
        <NavLink
          href="/account"
          className="flex size-11 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-fern-tint text-canopy shadow-sm"
          aria-label="Account settings"
        >
          <span className="font-display text-body-md font-semibold">
            {(user.email?.[0] ?? '?').toUpperCase()}
          </span>
        </NavLink>
      </div>
    );
  }

  return (
    <NavLink href="/login" className={navLinkClass}>
      Sign in
    </NavLink>
  );
}

export default function Header({ variant = 'landing', onBack, onClose }) {
  if (variant === 'assessment-mobile') {
    return (
      <header className="px-margin-mobile py-3 lg:hidden sm:px-6">
        <div className="floating-bar mx-auto flex max-w-container items-center justify-between px-4 py-3">
          <button
            type="button"
            onClick={onBack}
            className="btn-interactive flex h-10 w-10 items-center justify-center rounded-full text-canopy-600 hover:bg-fern-tint/60 active:scale-95"
            aria-label="Go back"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M15 18l-6-6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <Logo />
          <button
            type="button"
            onClick={onClose}
            className="btn-interactive flex h-10 w-10 items-center justify-center rounded-full text-canopy-600 hover:bg-fern-tint/60 active:scale-95"
            aria-label="Close assessment"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </header>
    );
  }

  if (variant === 'processing-mobile') {
    return (
      <header className="py-6 text-center lg:hidden">
        <Logo className="inline-block" />
      </header>
    );
  }

  return (
    <div className="mx-auto w-full max-w-landing px-margin-mobile pt-5 sm:px-8 lg:px-12">
      <header className="floating-bar flex items-center justify-between px-5 py-3.5 sm:px-6">
        <NavLink href="/" className="btn-interactive shrink-0 text-primary">
          <Logo />
        </NavLink>
        {variant === 'landing' || variant === 'account' || variant === 'share' ? (
          <div className="flex flex-1 items-center justify-end gap-6 sm:gap-9">
            <nav className="hidden items-center gap-8 md:flex">
              {variant === 'landing' ? (
                <>
                  <NavLink href="/about" className={navLinkClass}>
                    About
                  </NavLink>
                  <NavLink href="/faq" className={navLinkClass}>
                    FAQ
                  </NavLink>
                </>
              ) : variant === 'share' ? (
                <NavLink href="/" className={navLinkClass}>
                  Take assessment
                </NavLink>
              ) : (
                <NavLink href="/" className={navLinkClass}>
                  Assessment
                </NavLink>
              )}
            </nav>
            <AccountNav />
          </div>
        ) : null}
      </header>
    </div>
  );
}
