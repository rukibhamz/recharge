import nodemailer from 'nodemailer';
import { getSmtpSettings, clearSmtpSettingsCache } from './smtpSettings.js';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

function appOrigin() {
  const fromEnv = String(process.env.VITE_APP_URL || process.env.APP_URL || '')
    .trim()
    .replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  const cors = String(process.env.CORS_ORIGIN || '')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean)[0];
  return cors || 'http://localhost:5173';
}

export function getPublicAppOrigin() {
  return appOrigin();
}

async function createTransport(settings) {
  if (!settings?.host) {
    throw new Error('SMTP is not configured. Add SMTP in Admin → Settings → Email.');
  }

  return nodemailer.createTransport({
    host: settings.host,
    port: settings.port,
    secure: settings.secure,
    auth: settings.user
      ? {
          user: settings.user,
          pass: settings.pass,
        }
      : undefined,
  });
}

export async function logEmailSend({
  kind,
  toEmail,
  subject,
  status,
  error = '',
  sessionId = null,
  meta = {},
}) {
  if (!isSupabaseConfigured()) return;
  try {
    await supabase.from('email_sends').insert({
      kind,
      to_email: toEmail,
      subject: subject || '',
      status,
      error: String(error || '').slice(0, 500),
      session_id: sessionId,
      meta,
    });
  } catch (err) {
    console.warn('email_sends insert failed:', err.message);
  }
}

/**
 * Send a single email via configured SMTP.
 */
export async function sendMail({
  to,
  subject,
  text,
  html,
  kind = 'results',
  sessionId = null,
  meta = {},
}) {
  const settings = await getSmtpSettings();
  const transport = await createTransport(settings);
  const from = `"${settings.fromName}" <${settings.fromEmail}>`;

  try {
    const info = await transport.sendMail({
      from,
      to,
      subject,
      text,
      html: html || undefined,
    });

    await logEmailSend({
      kind,
      toEmail: to,
      subject,
      status: 'sent',
      sessionId,
      meta: { ...meta, messageId: info.messageId },
    });

    return { ok: true, messageId: info.messageId };
  } catch (err) {
    await logEmailSend({
      kind,
      toEmail: to,
      subject,
      status: 'failed',
      error: err.message,
      sessionId,
      meta,
    });
    throw err;
  }
}

export async function testSmtpConnection(toEmail) {
  clearSmtpSettingsCache();
  const settings = await getSmtpSettings({ force: true });
  const transport = await createTransport(settings);
  await transport.verify();

  if (toEmail) {
    await sendMail({
      to: toEmail,
      subject: 'Recharge SMTP test',
      text: 'Your Recharge SMTP settings are working.',
      html: '<p>Your Recharge SMTP settings are working.</p>',
      kind: 'smtp_test',
    });
  }

  return { ok: true, fromEmail: settings.fromEmail, host: settings.host };
}

export function plainTextToHtml(text) {
  const escaped = String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const withBreaks = escaped.replace(/\n/g, '<br />');
  return `<div style="font-family: Georgia, serif; font-size: 16px; line-height: 1.6; color: #16231C;">${withBreaks}</div>`;
}
