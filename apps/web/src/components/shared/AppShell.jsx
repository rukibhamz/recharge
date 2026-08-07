import { useEffect, useState } from 'react';
import Logo, { LogoMark } from './Logo.jsx';
import NavLink from './NavLink.jsx';
import { useTenant } from '../../context/TenantContext.jsx';

const COLLAPSE_KEY = 'recharge-sidebar-collapsed';

export function NavIcon({ name, className = 'h-5 w-5' }) {
  const common = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };

  switch (name) {
    case 'home':
      return (
        <svg {...common}>
          <path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1v-10.5z" />
        </svg>
      );
    case 'user':
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20a7 7 0 0 1 14 0" />
        </svg>
      );
    case 'chart':
      return (
        <svg {...common}>
          <path d="M4 19V5" />
          <path d="M4 19h16" />
          <path d="M8 15v-4" />
          <path d="M12 15V8" />
          <path d="M16 15v-6" />
        </svg>
      );
    case 'settings':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3v2.2M12 18.8V21M4.9 6.5l1.6 1.6M17.5 15.9l1.6 1.6M3 12h2.2M18.8 12H21M4.9 17.5l1.6-1.6M17.5 8.1l1.6-1.6" />
        </svg>
      );
    case 'plug':
      return (
        <svg {...common}>
          <path d="M9 7V3M15 7V3M8 11h8v3a4 4 0 0 1-8 0v-3zM12 18v3" />
        </svg>
      );
    case 'pulse':
      return (
        <svg {...common}>
          <path d="M3 12h4l2-5 3 10 2-5h7" />
        </svg>
      );
    case 'building':
      return (
        <svg {...common}>
          <path d="M4 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16" />
          <path d="M14 10h5a1 1 0 0 1 1 1v10" />
          <path d="M8 8h2M8 12h2M8 16h2" />
        </svg>
      );
    case 'chat':
      return (
        <svg {...common}>
          <path d="M5 18.5 4 21l2.5-1A9 9 0 1 0 5 18.5z" />
        </svg>
      );
    case 'compass':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="m15.5 8.5-2 5-5 2 2-5 5-2z" />
        </svg>
      );
    case 'logout':
      return (
        <svg {...common}>
          <path d="M10 17H6a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h4" />
          <path d="M14 15l4-3-4-3" />
          <path d="M18 12H10" />
        </svg>
      );
    case 'menu':
      return (
        <svg {...common}>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      );
    case 'panel':
      return (
        <svg {...common}>
          <path d="M4 6h16v12H4z" />
          <path d="M9 6v12" />
        </svg>
      );
    case 'close':
      return (
        <svg {...common}>
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="4" />
        </svg>
      );
  }
}

function NavItem({ item, collapsed, onNavigate }) {
  const active = Boolean(item.active);
  const base =
    'btn-interactive group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left font-sans text-[14px] font-semibold transition-colors';
  const tone = active
    ? 'bg-fern-tint text-canopy'
    : 'text-ink-soft hover:bg-linen-sunken hover:text-ink';

  const content = (
    <>
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          active ? 'bg-canopy text-white' : 'bg-linen-sunken text-canopy-600 group-hover:bg-fern-tint'
        }`}
      >
        <NavIcon name={item.icon} />
      </span>
      {!collapsed ? <span className="truncate">{item.label}</span> : null}
    </>
  );

  if (item.href) {
    return (
      <NavLink
        href={item.href}
        className={`${base} ${tone} ${collapsed ? 'justify-center px-2' : ''}`}
        title={collapsed ? item.label : undefined}
        aria-current={active ? 'page' : undefined}
        onClick={() => onNavigate?.()}
      >
        {content}
      </NavLink>
    );
  }

  return (
    <button
      type="button"
      className={`${base} ${tone} ${collapsed ? 'justify-center px-2' : ''}`}
      title={collapsed ? item.label : undefined}
      aria-current={active ? 'page' : undefined}
      onClick={() => {
        item.onClick?.();
        onNavigate?.();
      }}
    >
      {content}
    </button>
  );
}

function SidebarBody({
  collapsed,
  userEmail,
  userLabel,
  items,
  footerItems,
  onNavigate,
  onToggleCollapse,
  showCollapseToggle,
}) {
  const { brandName } = useTenant();
  const initial = (userEmail?.[0] || brandName?.[0] || '?').toUpperCase();

  return (
    <div className="flex h-full flex-col">
      <div className={`border-b border-linen-sunken ${collapsed ? 'px-2 py-4' : 'px-4 py-5'}`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          {collapsed ? (
            <LogoMark className="rounded-2xl" title={brandName} />
          ) : (
            <div className="min-w-0 flex-1">
              <Logo variant="compact" className="max-w-full" />
              <p className="mt-1 truncate font-sans text-[12px] text-ink-soft">
                {userLabel || userEmail || 'Signed in'}
              </p>
            </div>
          )}
        </div>
        {!collapsed && userEmail && userLabel ? (
          <p className="mt-1 truncate font-sans text-[12px] text-ink-faint">{userEmail}</p>
        ) : null}
      </div>

      <nav
        className={`flex-1 space-y-1 overflow-y-auto py-4 ${collapsed ? 'px-2' : 'px-3'}`}
        aria-label="Primary"
      >
        {items.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className={`space-y-1 border-t border-linen-sunken py-4 ${collapsed ? 'px-2' : 'px-3'}`}>
        {footerItems?.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}

        {showCollapseToggle ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className={`btn-interactive flex w-full items-center gap-3 rounded-xl px-3 py-2.5 font-sans text-[14px] font-semibold text-ink-soft transition-colors hover:bg-linen-sunken hover:text-ink ${
              collapsed ? 'justify-center px-2' : ''
            }`}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linen-sunken text-canopy-600">
              <NavIcon name="panel" />
            </span>
            {!collapsed ? <span>Collapse</span> : null}
          </button>
        ) : null}

        {!collapsed ? (
          <div className="mt-2 flex items-center gap-3 rounded-xl bg-linen-sunken/70 px-3 py-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-fern-tint font-display text-[14px] font-semibold text-canopy">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="truncate font-sans text-[13px] font-semibold text-ink">
                {userLabel || 'You'}
              </p>
              <p className="truncate font-sans text-[11px] text-ink-faint">{userEmail}</p>
            </div>
          </div>
        ) : (
          <div
            className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-fern-tint font-display text-[13px] font-semibold text-canopy"
            title={userEmail}
          >
            {initial}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * App shell with collapsible side navigation for account / admin areas.
 */
export default function AppShell({
  userEmail,
  userLabel,
  items = [],
  footerItems = [],
  children,
  className = '',
}) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
    } catch {
      // ignore
    }
  }, [collapsed]);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className={`flex min-h-screen bg-linen ${className}`}>
      {/* Desktop sidebar */}
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 border-r border-linen-sunken bg-linen-raised transition-[width] duration-200 ease-out md:flex md:flex-col ${
          collapsed ? 'w-[4.75rem]' : 'w-[16.5rem]'
        }`}
      >
        <SidebarBody
          collapsed={collapsed}
          userEmail={userEmail}
          userLabel={userLabel}
          items={items}
          footerItems={footerItems}
          onToggleCollapse={() => setCollapsed((v) => !v)}
          showCollapseToggle
        />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-[90] md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink/35 backdrop-blur-[1px]"
            aria-label="Close navigation"
            onClick={closeMobile}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(18rem,88vw)] flex-col border-r border-linen-sunken bg-linen-raised shadow-2xl">
            <div className="flex items-center justify-between border-b border-linen-sunken px-4 py-3">
              <Logo />
              <button
                type="button"
                onClick={closeMobile}
                className="btn-interactive rounded-full p-2 text-ink-soft hover:bg-linen-sunken"
                aria-label="Close menu"
              >
                <NavIcon name="close" />
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <SidebarBody
                collapsed={false}
                userEmail={userEmail}
                userLabel={userLabel}
                items={items}
                footerItems={footerItems}
                onNavigate={closeMobile}
                showCollapseToggle={false}
              />
            </div>
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-linen-sunken bg-linen/90 px-4 py-3 backdrop-blur-sm md:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="btn-interactive flex h-10 w-10 items-center justify-center rounded-full text-canopy hover:bg-fern-tint"
            aria-label="Open navigation"
          >
            <NavIcon name="menu" />
          </button>
          <Logo />
          <div className="h-10 w-10" aria-hidden="true" />
        </header>

        <div className="min-h-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
