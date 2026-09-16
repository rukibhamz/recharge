import { sanitizeEmailAddress } from '@recharge/shared/emailMarketing';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { getPublicAppOrigin, plainTextToHtml, sendMail } from './mailer.js';

export async function upsertNewsletterSubscriber({
  email,
  source = 'results',
  sessionId = null,
  userId = null,
}) {
  const cleaned = sanitizeEmailAddress(email);
  if (!cleaned) throw new Error('Enter a valid email address.');
  if (!isSupabaseConfigured()) throw new Error('Database not configured');

  const now = new Date().toISOString();
  const { data: existing } = await supabase
    .from('newsletter_subscribers')
    .select('id, status')
    .ilike('email', cleaned)
    .maybeSingle();

  if (existing?.id) {
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .update({
        status: 'subscribed',
        source,
        session_id: sessionId || null,
        user_id: userId || null,
        subscribed_at: now,
        unsubscribed_at: null,
        updated_at: now,
      })
      .eq('id', existing.id)
      .select('id, email, status')
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .insert({
      email: cleaned,
      status: 'subscribed',
      source,
      session_id: sessionId || null,
      user_id: userId || null,
      subscribed_at: now,
    })
    .select('id, email, status')
    .single();

  if (error) throw error;
  return data;
}

export async function listNewsletterSubscribers({ limit = 200, status = 'subscribed' } = {}) {
  if (!isSupabaseConfigured()) throw new Error('Database not configured');

  let query = supabase
    .from('newsletter_subscribers')
    .select('id, email, status, source, subscribed_at, created_at')
    .order('subscribed_at', { ascending: false })
    .limit(Math.min(Number(limit) || 200, 1000));

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function countNewsletterSubscribers() {
  if (!isSupabaseConfigured()) return { subscribed: 0, unsubscribed: 0 };
  const [{ count: subscribed }, { count: unsubscribed }] = await Promise.all([
    supabase
      .from('newsletter_subscribers')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'subscribed'),
    supabase
      .from('newsletter_subscribers')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'unsubscribed'),
  ]);
  return {
    subscribed: subscribed ?? 0,
    unsubscribed: unsubscribed ?? 0,
  };
}

export async function unsubscribeNewsletter(email) {
  const cleaned = sanitizeEmailAddress(email);
  if (!cleaned) throw new Error('Enter a valid email address.');
  if (!isSupabaseConfigured()) throw new Error('Database not configured');

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .update({
      status: 'unsubscribed',
      unsubscribed_at: now,
      updated_at: now,
    })
    .ilike('email', cleaned)
    .select('id, email, status')
    .maybeSingle();

  if (error) throw error;
  return data;
}

function newsletterHtml(bodyText, { unsubscribeHint = true } = {}) {
  const origin = getPublicAppOrigin();
  const body = plainTextToHtml(bodyText);
  const footer = unsubscribeHint
    ? `<p style="margin-top:32px;font-size:12px;color:#8B9289;font-family:system-ui,sans-serif;">
        You are receiving this because you opted in on Recharge.
        To stop these emails, reply and ask to unsubscribe, or visit
        <a href="${origin}/feedback">feedback</a>.
      </p>`
    : '';
  return `<!DOCTYPE html><html><body style="background:#F6F2E9;padding:24px;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:14px;padding:28px;">
      <p style="font-family:system-ui,sans-serif;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#2D6A4F;margin:0 0 16px;">Recharge</p>
      ${body}
      ${footer}
    </div>
  </body></html>`;
}

/**
 * Send newsletter to all subscribed addresses, or a single test recipient.
 */
export async function sendNewsletter({ subject, bodyText, testOnly = false, testEmail = '' }) {
  if (testOnly) {
    await sendMail({
      to: testEmail,
      subject: `[Test] ${subject}`,
      text: bodyText,
      html: newsletterHtml(bodyText, { unsubscribeHint: false }),
      kind: 'newsletter_test',
      meta: { test: true },
    });
    return { ok: true, sent: 1, failed: 0, mode: 'test' };
  }

  const subscribers = await listNewsletterSubscribers({ limit: 1000, status: 'subscribed' });
  if (!subscribers.length) {
    throw new Error('No subscribed emails yet.');
  }

  let sent = 0;
  let failed = 0;
  const errors = [];

  for (const row of subscribers) {
    try {
      await sendMail({
        to: row.email,
        subject,
        text: bodyText,
        html: newsletterHtml(bodyText),
        kind: 'newsletter',
        meta: { subscriberId: row.id },
      });
      sent += 1;
    } catch (err) {
      failed += 1;
      errors.push({ email: row.email, error: err.message });
    }
  }

  return { ok: failed === 0, sent, failed, mode: 'broadcast', errors: errors.slice(0, 10) };
}
