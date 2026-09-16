/** Newsletter + result-email validation helpers (no secrets). */

export function sanitizeEmailAddress(email) {
  const value = String(email ?? '').trim().toLowerCase().slice(0, 120);
  if (!value) return '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return '';
  return value;
}

export function sanitizeEmailSubject(text) {
  return String(text ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180);
}

export function sanitizeEmailBody(text) {
  return String(text ?? '')
    .replace(/\r\n/g, '\n')
    .trim()
    .slice(0, 20000);
}

export function validateResultsEmailPayload(body = {}) {
  const email = sanitizeEmailAddress(body.email);
  const sessionId = String(body.sessionId ?? '').trim();
  const newsletterOptIn = Boolean(body.newsletterOptIn);

  if (!sessionId || !/^[0-9a-f-]{36}$/i.test(sessionId)) {
    return { ok: false, error: 'Missing assessment session.' };
  }
  if (!email) {
    return { ok: false, error: 'Enter a valid email address.' };
  }

  return {
    ok: true,
    value: { email, sessionId, newsletterOptIn },
  };
}

export function validateNewsletterSubscribePayload(body = {}) {
  const email = sanitizeEmailAddress(body.email);
  const source = ['results', 'account', 'admin', 'other'].includes(body.source)
    ? body.source
    : 'other';

  if (!email) {
    return { ok: false, error: 'Enter a valid email address.' };
  }

  return { ok: true, value: { email, source } };
}

export function validateNewsletterSendPayload(body = {}) {
  const subject = sanitizeEmailSubject(body.subject);
  const bodyText = sanitizeEmailBody(body.body ?? body.bodyText ?? body.message);
  const testEmail = sanitizeEmailAddress(body.testEmail);
  const testOnly = Boolean(body.testOnly || testEmail);

  if (subject.length < 3) {
    return { ok: false, error: 'Subject needs at least a few characters.' };
  }
  if (bodyText.length < 20) {
    return { ok: false, error: 'Write a longer newsletter body (at least a short paragraph).' };
  }
  if (testOnly && !testEmail) {
    return { ok: false, error: 'Enter a test email address.' };
  }

  return {
    ok: true,
    value: {
      subject,
      bodyText,
      testOnly,
      testEmail: testEmail || '',
    },
  };
}

export function validateSmtpSettingsPayload(body = {}, { requirePass = false } = {}) {
  const host = String(body.host ?? '').trim().slice(0, 200);
  const user = String(body.user ?? '').trim().slice(0, 200);
  const fromName = String(body.fromName ?? 'Recharge').trim().slice(0, 80) || 'Recharge';
  const fromEmail = sanitizeEmailAddress(body.fromEmail);
  const pass = String(body.pass ?? '');
  const port = Number(body.port);
  const secure = Boolean(body.secure);

  if (!host) return { ok: false, error: 'SMTP host is required.' };
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return { ok: false, error: 'SMTP port must be a number between 1 and 65535.' };
  }
  if (!fromEmail) return { ok: false, error: 'From email must be valid.' };
  if (requirePass && !pass.trim()) {
    return { ok: false, error: 'SMTP password is required.' };
  }

  return {
    ok: true,
    value: {
      host,
      port,
      secure,
      user,
      pass,
      fromName,
      fromEmail,
    },
  };
}
