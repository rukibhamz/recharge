import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_WORKSPACE_CONTENT } from '@recharge/shared/workspaceContent';
import { resolveTenant } from '../services/api.js';

const TenantContext = createContext({
  workspace: null,
  loading: true,
  brandName: 'Recharge',
  primaryColor: '#003441',
  content: DEFAULT_WORKSPACE_CONTENT,
  isWhiteLabel: false,
});

export function TenantProvider({ children }) {
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const host = window.location.hostname;

    (async () => {
      try {
        const { workspace: resolved } = await resolveTenant(host);
        if (mounted) setWorkspace(resolved ?? null);
      } catch (err) {
        console.warn('Tenant resolve skipped:', err.message);
        if (mounted) setWorkspace(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!workspace?.primaryColor) {
      document.documentElement.style.removeProperty('--tenant-primary');
      return;
    }
    document.documentElement.style.setProperty('--tenant-primary', workspace.primaryColor);
  }, [workspace?.primaryColor]);

  const value = useMemo(() => {
    const content = workspace?.content
      ? { ...DEFAULT_WORKSPACE_CONTENT, ...workspace.content }
      : DEFAULT_WORKSPACE_CONTENT;
    return {
      workspace,
      loading,
      brandName: workspace?.brandName || 'Recharge',
      primaryColor: workspace?.primaryColor || '#003441',
      content,
      isWhiteLabel: Boolean(workspace),
    };
  }, [workspace, loading]);

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  return useContext(TenantContext);
}
