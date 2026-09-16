import { getSessionById, buildSessionResponse } from './sessions.js';
import { getPublicAppOrigin, plainTextToHtml, sendMail } from './mailer.js';
import { upsertNewsletterSubscriber } from './newsletter.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildResultsEmailContent(session) {
  const name = session.displayName || 'there';
  const level = session.burnout?.level || 'your current range';
  const pct = session.burnout?.pct != null ? `${session.burnout.pct}%` : null;
  const archetype =
    session.personality?.psychometricProfile?.diagnostic_summary?.primary_archetype ||
    session.personality?.type?.title ||
    session.personality?.typeCode ||
    'your profile';
  const origin = getPublicAppOrigin();
  const shareUrl = session.shareToken ? `${origin}/s/${session.shareToken}` : `${origin}/`;
  const day1 = session.recoveryRoadmap?.phases?.[0];
  const day1Steps = (day1?.steps ?? []).slice(0, 3);

  const lines = [
    `Hi ${name},`,
    '',
    'Here is a copy of your Recharge check-in.',
    '',
    `Burnout: ${level}${pct ? ` (${pct})` : ''}`,
    `Profile: ${archetype}`,
    '',
  ];

  if (day1) {
    lines.push(`Day 1 — ${day1.title || day1.label || 'Start here'}`);
    for (const step of day1Steps) {
      lines.push(`• ${step.title}${step.tip ? `: ${step.tip}` : ''}`);
    }
    lines.push('');
  }

  lines.push(
    'Open your result (share links may expire):',
    shareUrl,
    '',
    'Sign in on Recharge to unlock the full day-by-day plan and talk with Oma.',
    '',
    '— Recharge',
    'For self-reflection only. Not a medical diagnosis.',
  );

  const text = lines.join('\n');

  const stepsHtml = day1Steps
    .map(
      (s) =>
        `<li style="margin:0 0 8px;"><strong>${escapeHtml(s.title)}</strong>${
          s.tip ? ` — ${escapeHtml(s.tip)}` : ''
        }</li>`,
    )
    .join('');

  const html = `<!DOCTYPE html><html><body style="background:#F6F2E9;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:14px;padding:28px;font-family:Georgia,serif;color:#16231C;">
    <p style="font-family:system-ui,sans-serif;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#2D6A4F;margin:0 0 16px;">Your Recharge results</p>
    <p>Hi ${escapeHtml(name)},</p>
    <p>Here is a copy of your check-in.</p>
    <p><strong>Burnout:</strong> ${escapeHtml(level)}${pct ? ` (${escapeHtml(pct)})` : ''}<br/>
    <strong>Profile:</strong> ${escapeHtml(archetype)}</p>
    ${
      day1
        ? `<p><strong>Day 1 — ${escapeHtml(day1.title || day1.label || 'Start here')}</strong></p>
           <ul style="padding-left:18px;">${stepsHtml}</ul>`
        : ''
    }
    <p><a href="${escapeHtml(shareUrl)}" style="color:#2D6A4F;">Open your result</a></p>
    <p style="font-size:14px;color:#4A554D;">Sign in on Recharge to unlock the full day-by-day plan and talk with Oma.</p>
    <p style="font-size:12px;color:#8B9289;font-family:system-ui,sans-serif;">For self-reflection only. Not a medical diagnosis.</p>
  </div>
</body></html>`;

  return {
    subject: `Your Recharge results — ${level}`,
    text,
    html,
  };
}

/**
 * Email a session summary to the user; optionally add them to the newsletter list.
 */
export async function emailSessionResults({
  sessionId,
  email,
  newsletterOptIn = false,
  userId = null,
}) {
  const row = await getSessionById(sessionId);
  if (!row) {
    const err = new Error('Assessment session not found.');
    err.status = 404;
    throw err;
  }

  const session = await buildSessionResponse(row, { includeFullRoadmap: false });
  const content = buildResultsEmailContent(session);

  await sendMail({
    to: email,
    subject: content.subject,
    text: content.text,
    html: content.html,
    kind: 'results',
    sessionId,
    meta: { newsletterOptIn: Boolean(newsletterOptIn) },
  });

  let newsletter = null;
  if (newsletterOptIn) {
    newsletter = await upsertNewsletterSubscriber({
      email,
      source: 'results',
      sessionId,
      userId,
    });
  }

  return { ok: true, newsletterSubscribed: Boolean(newsletter) };
}
