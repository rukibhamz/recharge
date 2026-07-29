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
      coachConversations: await exportCoachConversations(userId),
    },
    error: null,
  };
}

async function exportCoachConversations(userId) {
  const { data: conversations, error } = await supabase
    .from('coach_conversations')
    .select('id, session_id, title, created_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error || !conversations?.length) return [];

  const results = [];
  for (const conv of conversations) {
    const { data: messages } = await supabase
      .from('coach_messages')
      .select('role, content, created_at')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: true });

    results.push({
      id: conv.id,
      sessionId: conv.session_id,
      title: conv.title,
      createdAt: conv.created_at,
      updatedAt: conv.updated_at,
      messages: messages ?? [],
    });
  }
  return results;
}

export async function deleteUserAccount(userId) {
  if (!isSupabaseConfigured()) {
    return { deleted: false, error: new Error('Database not configured') };
  }

  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) return { deleted: false, error };

  return { deleted: true, error: null };
}
