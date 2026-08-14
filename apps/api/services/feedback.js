import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

function missingTable(error) {
  return Boolean(error && /user_feedback|42P01/i.test(error.message));
}

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    email: row.email || null,
    category: row.category,
    rating: row.rating,
    message: row.message,
    page: row.page || '',
    status: row.status,
    adminNote: row.admin_note || '',
    signedIn: Boolean(row.user_id),
  };
}

export async function createFeedback({
  userId = null,
  email = '',
  category,
  rating = null,
  message,
  page = '',
}) {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error('Database not configured') };
  }

  const { data, error } = await supabase
    .from('user_feedback')
    .insert({
      user_id: userId,
      email: email || null,
      category,
      rating,
      message,
      page,
      status: 'new',
    })
    .select(
      'id, created_at, updated_at, email, category, rating, message, page, status, admin_note, user_id',
    )
    .single();

  if (error) {
    if (missingTable(error)) {
      return {
        data: null,
        error: new Error('Feedback is not set up yet. Run migration 018_user_feedback.sql in Supabase.'),
      };
    }
    return { data: null, error };
  }

  return { data: mapRow(data), error: null };
}

export async function listFeedback({ status = 'all', limit = 80 } = {}) {
  if (!isSupabaseConfigured()) {
    return { data: [], error: new Error('Database not configured') };
  }

  let query = supabase
    .from('user_feedback')
    .select(
      'id, created_at, updated_at, email, category, rating, message, page, status, admin_note, user_id',
    )
    .order('created_at', { ascending: false })
    .limit(Math.min(200, Math.max(1, Number(limit) || 80)));

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) {
    if (missingTable(error)) {
      return {
        data: [],
        error: new Error('Feedback is not set up yet. Run migration 018_user_feedback.sql in Supabase.'),
      };
    }
    return { data: [], error };
  }

  return { data: (data ?? []).map(mapRow), error: null };
}

export async function updateFeedback(id, { status, adminNote } = {}) {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error('Database not configured') };
  }

  const patch = { updated_at: new Date().toISOString() };
  if (status) patch.status = status;
  if (adminNote != null) patch.admin_note = String(adminNote).slice(0, 1000);

  const { data, error } = await supabase
    .from('user_feedback')
    .update(patch)
    .eq('id', id)
    .select(
      'id, created_at, updated_at, email, category, rating, message, page, status, admin_note, user_id',
    )
    .single();

  if (error) return { data: null, error };
  return { data: mapRow(data), error: null };
}

export async function countNewFeedback() {
  if (!isSupabaseConfigured()) return 0;
  const { count, error } = await supabase
    .from('user_feedback')
    .select('id', { head: true, count: 'exact' })
    .eq('status', 'new');
  if (error) return 0;
  return count ?? 0;
}
