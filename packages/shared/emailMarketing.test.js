import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  sanitizeEmailAddress,
  validateResultsEmailPayload,
  validateNewsletterSendPayload,
  validateSmtpSettingsPayload,
} from './emailMarketing.js';

describe('emailMarketing', () => {
  it('sanitizes emails', () => {
    assert.equal(sanitizeEmailAddress(' Ada@Example.COM '), 'ada@example.com');
    assert.equal(sanitizeEmailAddress('not-an-email'), '');
  });

  it('validates results email payload', () => {
    const bad = validateResultsEmailPayload({ email: 'x', sessionId: 'nope' });
    assert.equal(bad.ok, false);

    const ok = validateResultsEmailPayload({
      email: 'ada@example.com',
      sessionId: '11111111-1111-4111-8111-111111111111',
      newsletterOptIn: true,
    });
    assert.equal(ok.ok, true);
    assert.equal(ok.value.newsletterOptIn, true);
  });

  it('validates newsletter send and smtp', () => {
    const send = validateNewsletterSendPayload({
      subject: 'Hello friends',
      body: 'This is a short paragraph about recovery and capacity.',
    });
    assert.equal(send.ok, true);

    const smtp = validateSmtpSettingsPayload({
      host: 'smtp.example.com',
      port: 587,
      fromEmail: 'recharge@thedigitalerrand.com',
      pass: 'secret',
    });
    assert.equal(smtp.ok, true);
  });
});
