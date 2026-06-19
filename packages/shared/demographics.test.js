import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  demographicsPromptContext,
  guessCountryFromLocale,
  isValidDemographics,
  sanitizeDemographics,
} from './demographics.js';

describe('demographics', () => {
  it('validates required fields', () => {
    assert.equal(
      isValidDemographics({ country: 'NG', ageBand: '25-34', workContext: 'full_time' }),
      true,
    );
    assert.equal(isValidDemographics({ country: 'NG', ageBand: '25-34' }), false);
  });

  it('builds prompt context with city, country and work', () => {
    const ctx = demographicsPromptContext({
      country: 'NG',
      city: 'Abuja',
      ageBand: '25-34',
      workContext: 'full_time',
      workSector: 'technology',
    });
    assert.match(ctx, /Abuja/);
    assert.match(ctx, /Nigeria/);
    assert.match(ctx, /25–34/);
    assert.match(ctx, /Technology/);
  });

  it('sanitizes city', () => {
    const d = sanitizeDemographics({
      country: 'NG',
      city: '  Abuja  ',
      ageBand: '25-34',
      workContext: 'full_time',
    });
    assert.equal(d.city, 'Abuja');
  });

  it('guesses country from locale', () => {
    assert.equal(guessCountryFromLocale('en-NG'), 'NG');
    assert.equal(guessCountryFromLocale('en'), '');
  });

  it('sanitizes invalid values', () => {
    const d = sanitizeDemographics({
      country: 'XX',
      ageBand: '25-34',
      workContext: 'full_time',
    });
    assert.equal(d.country, '');
  });
});
