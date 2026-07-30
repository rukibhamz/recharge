import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { ensureProfile } from './sessions.js';
import { resolveCoachAssessmentContext } from './coachContext.js';
import { generateOmaReply, getOmaOpening } from './coachAgent.js';

function mapConversation(row) {
  if (!row) return null;
  return {
    id: row.id,
    sessionId: row.session_id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function snippet(text, max = 110) {
  const value = String(text ?? '').trim();
  if (!value) return '';
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

async function listConversationsForUser(userId, limit = 20) {
  const { data: rows, error } = await supabase
    .from('coach_conversations')
    .select('id, session_id, title, created_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) return { data: [], error };

  const conversations = [];
  for (const row of rows ?? []) {
    const { data: latestRows, error: latestError } = await supabase
      .from('coach_messages')
      .select('content, created_at')
      .eq('conversation_id', row.id)
      .order('created_at', { ascending: false })
      .limit(1);
    if (latestError) return { data: [], error: latestError };

    const { count, error: countError } = await supabase
      .from('coach_messages')
      .select('id', { head: true, count: 'exact' })
      .eq('conversation_id', row.id);
    if (countError) return { data: [], error: countError };

    const latest = latestRows?.[0] ?? null;
    conversations.push({
      ...mapConversation(row),
      lastMessageSnippet: snippet(latest?.content),
      lastMessageAt: latest?.created_at ?? row.updated_at,
      messageCount: count ?? 0,
    });
  }

  return { data: conversations, error: null };
}

function mapMessage(row) {
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at,
  };
}

export async function getCoachStatus(userId, email) {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error('Database not configured') };
  }

  await ensureProfile(userId, email);

  const { assessments, session, error: ctxError } = await resolveCoachAssessmentContext(userId);
  if (ctxError) return { data: null, error: ctxError };

  const { data: conversations, error: convError } = await listConversationsForUser(userId);
  if (convError && !/coach_conversations/i.test(convError.message) && convError.code !== '42P01') {
    return { data: null, error: convError };
  }
  const conversation = conversations?.[0] ?? null;

  let messages = [];
  if (conversation?.id) {
    const { data: rows, error: msgError } = await supabase
      .from('coach_messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true })
      .limit(100);

    if (msgError && !/coach_messages/i.test(msgError.message)) {
      return { data: null, error: msgError };
    }
    messages = (rows ?? []).map(mapMessage);
  }

  return {
    data: {
      coachName: 'Oma',
      hasAssessment: Boolean(session),
      assessments: assessments.map((a) => ({
        sessionId: a.sessionId,
        displayName: a.displayName,
        burnoutLevel: a.burnout?.level,
        personalityName: a.personality?.type?.name,
        createdAt: a.createdAt,
      })),
      activeSessionId: session?.sessionId ?? null,
      conversations: conversations ?? [],
      conversation: conversation ? mapConversation(conversation) : null,
      messages,
      opening: getOmaOpening(),
    },
    error: null,
  };
}

export async function startCoachConversation(userId, email, sessionId = null) {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error('Database not configured') };
  }

  await ensureProfile(userId, email);

  const { assessments, session, error: ctxError } = await resolveCoachAssessmentContext(
    userId,
    sessionId,
  );
  if (ctxError) return { data: null, error: ctxError };
  if (!session) {
    return { data: null, error: new Error('Save an assessment to your account before chatting with Oma.') };
  }

  const opening = getOmaOpening();
  const { data: conversation, error: createError } = await supabase
    .from('coach_conversations')
    .insert({
      user_id: userId,
      session_id: session.sessionId,
      title: 'Chat with Oma',
    })
    .select('id, session_id, title, created_at, updated_at')
    .single();

  if (createError) return { data: null, error: createError };

  const { data: openingRow, error: msgError } = await supabase
    .from('coach_messages')
    .insert({
      conversation_id: conversation.id,
      role: 'assistant',
      content: opening,
    })
    .select('id, role, content, created_at')
    .single();

  if (msgError) return { data: null, error: msgError };

  const { data: conversations, error: convListError } = await listConversationsForUser(userId);
  if (convListError) return { data: null, error: convListError };

  return {
    data: {
      coachName: 'Oma',
      hasAssessment: true,
      assessments: assessments.map((a) => ({
        sessionId: a.sessionId,
        displayName: a.displayName,
        burnoutLevel: a.burnout?.level,
        personalityName: a.personality?.type?.name,
        createdAt: a.createdAt,
      })),
      activeSessionId: session.sessionId,
      conversations: conversations ?? [],
      conversation: mapConversation(conversation),
      messages: [mapMessage(openingRow)],
      opening,
    },
    error: null,
  };
}

async function assertConversationOwner(userId, conversationId) {
  const { data, error } = await supabase
    .from('coach_conversations')
    .select('id, user_id, session_id, title, created_at, updated_at')
    .eq('id', conversationId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) return { conversation: null, error };
  if (!data) return { conversation: null, error: new Error('Conversation not found') };
  return { conversation: data, error: null };
}

export async function getCoachConversationMessages(userId, conversationId) {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error('Database not configured') };
  }

  const { conversation, error: ownerError } = await assertConversationOwner(userId, conversationId);
  if (ownerError) return { data: null, error: ownerError };

  const { data: rows, error } = await supabase
    .from('coach_messages')
    .select('id, role, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(120);

  if (error) return { data: null, error };

  return {
    data: {
      conversation: mapConversation(conversation),
      messages: (rows ?? []).map(mapMessage),
    },
    error: null,
  };
}

export async function sendCoachMessage(userId, email, conversationId, content) {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error('Database not configured') };
  }

  const trimmed = String(content ?? '').trim();
  if (!trimmed || trimmed.length > 2000) {
    return { data: null, error: new Error('Message must be between 1 and 2000 characters.') };
  }

  await ensureProfile(userId, email);

  const { conversation, error: ownerError } = await assertConversationOwner(userId, conversationId);
  if (ownerError) return { data: null, error: ownerError };

  const { session, error: ctxError } = await resolveCoachAssessmentContext(
    userId,
    conversation.session_id,
  );
  if (ctxError) return { data: null, error: ctxError };

  const { data: historyRows, error: historyError } = await supabase
    .from('coach_messages')
    .select('id, role, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(40);

  if (historyError) return { data: null, error: historyError };

  const { data: userRow, error: userInsertError } = await supabase
    .from('coach_messages')
    .insert({
      conversation_id: conversationId,
      role: 'user',
      content: trimmed,
    })
    .select('id, role, content, created_at')
    .single();

  if (userInsertError) return { data: null, error: userInsertError };

  const { reply, source } = await generateOmaReply({
    session,
    history: historyRows ?? [],
    userMessage: trimmed,
  });

  const { data: assistantRow, error: assistantError } = await supabase
    .from('coach_messages')
    .insert({
      conversation_id: conversationId,
      role: 'assistant',
      content: reply,
    })
    .select('id, role, content, created_at')
    .single();

  if (assistantError) return { data: null, error: assistantError };

  await supabase
    .from('coach_conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  return {
    data: {
      userMessage: mapMessage(userRow),
      assistantMessage: mapMessage(assistantRow),
      source,
    },
    error: null,
  };
}
