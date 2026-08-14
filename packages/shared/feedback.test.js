import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateFeedbackPayload, sanitizeFeedbackEmail } from './feedback.js';

describe('feedback', () => {
  it('rejects short messages and unknown categories', () => {
    assert.equal(validateFeedbackPayload({ category: 'questions', message: 'hi' }).ok, false);
    assert.equal(validateFeedbackPayload({ category: 'nope', message: 'This is long enough to submit.' }).ok, false);
  });

  it('accepts a valid suggestion', () => {
    const check = validateFeedbackPayload({
      category: 'idea',
      message: 'Please add a weekly reminder email after a high burnout score.',
      rating: 4,
      email: 'Ada@Example.com',
      page: 'results',
    });
    assert.equal(check.ok, true);
    assert.equal(check.value.email, 'ada@example.com');
    assert.equal(check.value.rating, 4);
  });

  it('drops invalid emails', () => {
    assert.equal(sanitizeFeedbackEmail('not-an-email'), '');
  });
});
