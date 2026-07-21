import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { isSupabaseAuthConfigured, supabase } from '../lib/supabase.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(isSupabaseAuthConfigured());

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return undefined;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithOtp = useCallback(async (email) => {
    if (!supabase) throw new Error('Sign-in is not configured.');
    // Prefer explicit production origin so magic links never fall back to a
    // localhost Site URL when VITE_APP_URL is set on Vercel.
    const configuredOrigin = (import.meta.env.VITE_APP_URL || '').replace(/\/$/, '');
    const origin = configuredOrigin || window.location.origin;
    const redirectTo = `${origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  const getAccessToken = useCallback(async () => {
    if (!supabase) return null;
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isConfigured: isSupabaseAuthConfigured(),
      signInWithOtp,
      signOut,
      getAccessToken,
    }),
    [user, loading, signInWithOtp, signOut, getAccessToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
