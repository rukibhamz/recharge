import Logo from './Logo.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useIsAdmin } from '../../hooks/useIsAdmin.js';

function AccountNav() {
  const { user, loading, isConfigured } = useAuth();
  const { isAdmin } = useIsAdmin();

  if (!isConfigured || loading) return null;

  if (user) {
    return (
      <nav className="flex items-center gap-4">
        {isAdmin ? (
          <a
            href="/admin"
            className="hidden font-sans text-body-md text-on-surface-variant btn-interactive hover:text-primary sm:inline"
          >
            Admin
          </a>
        ) : null}
        <a
          href="/account"
          className="hidden font-sans text-body-md text-on-surface-variant btn-interactive hover:text-primary sm:inline"
        >
          Account
        </a>
        <a
          href="/account"
          className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-secondary-container text-primary"
          aria-label="Account settings"
        >
          <span className="font-display text-body-md font-semibold">
            {(user.email?.[0] ?? '?').toUpperCase()}
          </span>
        </a>
      </nav>
    );
  }

  return (
    <a href="/login" className="btn-interactive font-sans text-body-md text-primary hover:underline">
      Sign in
    </a>
  );
}

export default function Header({ variant = 'landing', onBack, onClose }) {
  if (variant === 'assessment-mobile') {
    return (
      <header className="border-b border-outline-variant/30 bg-warm lg:hidden">
        <div className="mx-auto flex max-w-container items-center justify-between px-margin-mobile py-4">
          <button
            type="button"
            onClick={onBack}
            className="btn-interactive flex h-10 w-10 items-center justify-center rounded-full text-primary hover:bg-primary/5 active:scale-95"
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
            className="btn-interactive flex h-10 w-10 items-center justify-center rounded-full text-primary hover:bg-primary/5 active:scale-95"
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
    <header className="mx-auto flex w-full max-w-landing items-center justify-between px-margin-mobile py-6 sm:px-8 lg:px-12">
      <Logo />
      {variant === 'landing' || variant === 'account' ? (
        <nav className="flex items-center gap-8 font-sans text-body-md text-on-surface-variant">
          {variant === 'landing' ? (
            <>
              <a href="#about" className="btn-interactive hover:text-primary">
                About
              </a>
              <a href="#faq" className="btn-interactive hover:text-primary">
                FAQ
              </a>
            </>
          ) : (
            <a href="/" className="btn-interactive hover:text-primary">
              Assessment
            </a>
          )}
          <AccountNav />
        </nav>
      ) : null}
    </header>
  );
}
