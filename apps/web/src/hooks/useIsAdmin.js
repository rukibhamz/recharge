import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { fetchAdminAccess } from '../services/api.js';

/** Resolves once per signed-in user whether they are an allowlisted admin. */
export function useIsAdmin() {
  const { user, loading: authLoading, getAccessToken, isConfigured } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return undefined;
    if (!isConfigured || !user) {
      setIsAdmin(false);
      setLoading(false);
      return undefined;
    }

    let mounted = true;
    setLoading(true);

    (async () => {
      try {
        const token = await getAccessToken();
        const data = await fetchAdminAccess(token);
        if (mounted) setIsAdmin(Boolean(data?.admin));
      } catch {
        if (mounted) setIsAdmin(false);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [user, authLoading, getAccessToken, isConfigured]);

  return { isAdmin, loading };
}
