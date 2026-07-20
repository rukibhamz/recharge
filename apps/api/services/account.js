import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

export async function exportUserData(userId, email) {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error('Database not configured') };
  }

  const { data, error } = await supabase
    .from('user_sessions')
    .select(
      `
      created_at,
      sessions (
        id,
        share_token,
        display_name,
        created_at,
        demographics,
        burnout_pct,
        burnout_level,
        burnout_cls,
        personality_type,
        personality_name,
        traits,
        recommendations
      )
    `,
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) return { data: null, error };

  const sessions = (data ?? [])
    .map((row) => row.sessions)
    .filter(Boolean)
    .map((s) => ({
      sessionId: s.id,
      shareToken: s.share_token,
      displayName: s.display_name,
      createdAt: s.created_at,
      demographics: s.demographics,
      burnout: {
        pct: s.burnout_pct,
        level: s.burnout_level,
        cls: s.burnout_cls,
      },
      personality: {
        typeCode: s.personality_type,
        name: s.personality_name,
        traits: s.traits,
      },
      recommendations: s.recommendations,
    }));

  return {
    data: {
      exportedAt: new Date().toISOString(),
      accountEmail: email ?? null,
      sessions,
    },
    error: null,
  };
}

export async function deleteUserAccount(userId) {
  if (!isSupabaseConfigured()) {
    return { deleted: false, error: new Error('Database not configured') };
  }

  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) return { deleted: false, error };

  return { deleted: true, error: null };
}
