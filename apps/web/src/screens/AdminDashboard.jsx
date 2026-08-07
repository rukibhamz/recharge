import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { fetchAdminLlmMonitor, fetchAdminStats } from '../services/api.js';
import AppShell from '../components/shared/AppShell.jsx';
import Button from '../components/shared/Button.jsx';
import PageLoadingState from '../components/shared/PageLoadingState.jsx';
import WorkspaceManager from '../components/admin/WorkspaceManager.jsx';
import ConnectorsManager from '../components/admin/ConnectorsManager.jsx';
import LlmMonitorPanel from '../components/admin/LlmMonitorPanel.jsx';
import CoachSettingsPanel from '../components/admin/CoachSettingsPanel.jsx';
import HealthDashboard from '../components/admin/HealthDashboard.jsx';
import { firstName } from '@recharge/shared/name';

const ADMIN_TAB_KEY = 'recharge-admin-tab';
const VALID_TABS = new Set(['dashboard', 'organizations', 'analytics', 'settings', 'monitor']);

/** Map legacy tab ids from bookmarks / older localStorage values. */
const LEGACY_TAB_MAP = {
  stats: 'dashboard',
  saas: 'organizations',
  coach: 'settings',
  connectors: 'settings',
};

function resolveInitialTab() {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get('tab');
  if (fromQuery && VALID_TABS.has(fromQuery)) return fromQuery;
  if (fromQuery && LEGACY_TAB_MAP[fromQuery]) return LEGACY_TAB_MAP[fromQuery];

  const fromStorage = localStorage.getItem(ADMIN_TAB_KEY);
  if (fromStorage && VALID_TABS.has(fromStorage)) return fromStorage;
  if (fromStorage && LEGACY_TAB_MAP[fromStorage]) return LEGACY_TAB_MAP[fromStorage];

  return 'dashboard';
}

function SettingsHub({ getAccessToken, section, setSection }) {
  return (
    <div className="space-y-6">
      <header>
        <p className="hero-badge">Platform settings</p>
        <h1 className="mt-3 font-display text-headline-lg font-light text-ink">Settings</h1>
        <p className="mt-2 max-w-xl font-sans text-body-md text-ink-soft">
          Configure Oma and connected AI providers for assessments and coach chat.
        </p>
      </header>

      <div className="flex flex-wrap gap-2 border-b border-linen-sunken pb-px">
        {[
          { id: 'coach', label: 'Coach' },
          { id: 'connectors', label: 'AI connectors' },
        ].map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSection(s.id)}
            className={`btn-interactive -mb-px border-b-2 px-4 py-2.5 font-sans text-[14px] font-semibold ${
              section === s.id
                ? 'border-canopy text-canopy'
                : 'border-transparent text-ink-soft hover:text-ink'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {section === 'coach' ? <CoachSettingsPanel getAccessToken={getAccessToken} /> : null}
      {section === 'connectors' ? <ConnectorsManager getAccessToken={getAccessToken} /> : null}
    </div>
  );
}

export default function AdminDashboard() {
  const { user, loading: authLoading, getAccessToken, signOut } = useAuth();
  const [tab, setTab] = useState(resolveInitialTab);
  const [settingsSection, setSettingsSection] = useState('coach');
  const [stats, setStats] = useState(null);
  const [llmSummary, setLlmSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      window.location.replace('/login');
      return;
    }

    let mounted = true;

    (async () => {
      try {
        const token = await getAccessToken();
        const [statsData, monitor] = await Promise.all([
          fetchAdminStats(token),
          fetchAdminLlmMonitor(token).catch(() => null),
        ]);
        if (!mounted) return;
        setStats(statsData);

        if (monitor) {
          const models = monitor.models ?? monitor.connectors ?? [];
          const withLatency = models.filter(
            (m) =>
              m.last24h?.avgLatencyMs != null ||
              m.process?.avgLatencyMs != null ||
              m.avgLatencyMs != null,
          );
          const avgLatency =
            withLatency.length > 0
              ? Math.round(
                  withLatency.reduce((sum, m) => {
                    const lat =
                      m.last24h?.avgLatencyMs ??
                      m.process?.avgLatencyMs ??
                      m.avgLatencyMs ??
                      0;
                    return sum + lat;
                  }, 0) / withLatency.length,
                )
              : null;
          const down = models.filter((m) => m.status === 'down' || m.health === 'down').length;
          const degraded = models.filter(
            (m) => m.status === 'degraded' || m.health === 'degraded',
          ).length;
          let status = 'up';
          if (down > 0) status = 'down';
          else if (degraded > 0) status = 'degraded';

          setLlmSummary({
            status,
            statusLabel:
              status === 'up' ? 'Stable' : status === 'degraded' ? 'Degraded' : 'Attention',
            latencyLabel: avgLatency != null ? `${avgLatency} ms avg` : 'No recent calls',
            bar: avgLatency != null ? Math.max(8, Math.min(100, 100 - avgLatency / 8)) : 40,
            note:
              down > 0
                ? `${down} model path${down === 1 ? '' : 's'} reporting failures. Check AI monitoring.`
                : models.length
                  ? 'Connectors responding within expected range.'
                  : 'Enable a connector to track AI latency.',
          });
        }
      } catch (err) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [user, authLoading, getAccessToken]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('tab', tab);
    const query = params.toString();
    const url = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState(null, '', url);
    localStorage.setItem(ADMIN_TAB_KEY, tab);
  }, [tab]);

  useEffect(() => {
    const onPopState = () => {
      const params = new URLSearchParams(window.location.search);
      const next = params.get('tab');
      if (next && VALID_TABS.has(next)) setTab(next);
      else if (next && LEGACY_TAB_MAP[next]) setTab(LEGACY_TAB_MAP[next]);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const userLabel = firstName(user?.email?.split('@')[0]) || 'Admin';

  const navItems = useMemo(
    () => [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'home',
        active: tab === 'dashboard',
        onClick: () => setTab('dashboard'),
      },
      {
        id: 'organizations',
        label: 'Organizations',
        icon: 'building',
        active: tab === 'organizations',
        onClick: () => setTab('organizations'),
      },
      {
        id: 'analytics',
        label: 'Analytics',
        icon: 'chart',
        active: tab === 'analytics',
        onClick: () => setTab('analytics'),
      },
      {
        id: 'monitor',
        label: 'AI monitoring',
        icon: 'pulse',
        active: tab === 'monitor',
        onClick: () => setTab('monitor'),
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: 'settings',
        active: tab === 'settings',
        onClick: () => setTab('settings'),
      },
    ],
    [tab],
  );

  const footerItems = useMemo(
    () => [
      { id: 'account', label: 'Account', icon: 'user', href: '/account' },
      { id: 'assessment', label: 'Assessment', icon: 'compass', href: '/' },
      {
        id: 'logout',
        label: 'Sign out',
        icon: 'logout',
        onClick: () =>
          signOut().then(() => {
            window.location.href = '/';
          }),
      },
    ],
    [signOut],
  );

  const exportSnapshot = () => {
    if (!stats) return;
    const blob = new Blob([JSON.stringify(stats, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recharge-admin-snapshot-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linen">
        <PageLoadingState message="Loading admin…" artworkVariant="reflection" />
      </div>
    );
  }

  return (
    <AppShell
      userEmail={user?.email}
      userLabel={userLabel}
      items={navItems}
      footerItems={footerItems}
    >
      {() => (
        <main className="mx-auto w-full max-w-[72rem] flex-1 px-margin-mobile py-6 sm:px-8 lg:px-10">
          {error ? (
            <div className="surface-card border-signal-red/30 bg-signal-red-tint p-8 text-center">
              <p className="font-sans text-body-md text-ink">{error}</p>
              <p className="mt-2 font-sans text-body-md text-ink-soft">
                Sign in with an email listed in{' '}
                <code className="font-mono text-canopy">ADMIN_EMAILS</code> on the API host.
              </p>
              <Button className="mt-6" onClick={() => { window.location.href = '/account'; }}>
                Back to account
              </Button>
            </div>
          ) : null}

          {!error && tab === 'dashboard' ? (
            <HealthDashboard
              stats={stats}
              llmSummary={llmSummary}
              loading={loading}
              onExport={exportSnapshot}
              onViewOrganizations={() => setTab('organizations')}
            />
          ) : null}

          {!error && tab === 'organizations' ? (
            <div className="space-y-6">
              <header>
                <p className="hero-badge">B2B</p>
                <h1 className="mt-3 font-display text-headline-lg font-light text-ink">
                  Organizations
                </h1>
                <p className="mt-2 max-w-xl font-sans text-body-md text-ink-soft">
                  White-label workspaces for business clients — brand, domain, and content.
                </p>
              </header>
              <WorkspaceManager getAccessToken={getAccessToken} />
            </div>
          ) : null}

          {!error && tab === 'analytics' ? (
            <HealthDashboard
              stats={stats}
              llmSummary={llmSummary}
              loading={loading}
              variant="analytics"
              onExport={exportSnapshot}
              onViewOrganizations={() => setTab('organizations')}
            />
          ) : null}

          {!error && tab === 'monitor' ? (
            <div className="space-y-6">
              <header>
                <p className="hero-badge">Infrastructure</p>
                <h1 className="mt-3 font-display text-headline-lg font-light text-ink">
                  AI monitoring
                </h1>
              </header>
              <LlmMonitorPanel getAccessToken={getAccessToken} />
            </div>
          ) : null}

          {!error && tab === 'settings' ? (
            <SettingsHub
              getAccessToken={getAccessToken}
              section={settingsSection}
              setSection={setSettingsSection}
            />
          ) : null}
        </main>
      )}
    </AppShell>
  );
}
