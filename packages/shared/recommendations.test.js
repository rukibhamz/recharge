import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  hasDisplayableRecommendations,
  normalizeRecommendationItem,
  normalizeRecommendationsList,
} from './recommendations.js';

const FALLBACK = [
  { icon: '🌿', title: 'Protect your rhythm', tip: 'Block one recovery slot each day.' },
  { icon: '🚶', title: 'Move with intention', tip: 'Take a ten-minute walk after lunch.' },
];

describe('recommendations', () => {
  it('normalizes canonical shape', () => {
    const item = normalizeRecommendationItem({
      icon: '🌿',
      title: 'Schedule recovery',
      tip: 'Block thirty minutes daily.',
    });
    assert.equal(item.title, 'Schedule recovery');
    assert.equal(item.tip, 'Block thirty minutes daily.');
  });

  it('maps alternate LLM field names', () => {
    const item = normalizeRecommendationItem({
      emoji: '🎯',
      heading: 'Narrow your focus',
      description: 'Limit active projects to three maximum.',
    });
    assert.equal(item.icon, '🎯');
    assert.equal(item.title, 'Narrow your focus');
    assert.equal(item.tip, 'Limit active projects to three maximum.');
  });

  it('extracts wrapped recommendation arrays', () => {
    const list = normalizeRecommendationsList(
      {
        recommendations: [
          { emoji: '🌿', headline: 'Rest first', body: 'Treat rest as maintenance.' },
        ],
      },
      FALLBACK,
    );
    assert.equal(list.length, 2);
    assert.equal(list[0].title, 'Rest first');
    assert.equal(list[0].tip, 'Treat rest as maintenance.');
    assert.equal(list[1].title, FALLBACK[1].title);
  });

  it('falls back when items are empty objects', () => {
    const list = normalizeRecommendationsList([{}, {}, {}, {}], FALLBACK);
    assert.equal(list[0].title, FALLBACK[0].title);
    assert.equal(list[0].tip, FALLBACK[0].tip);
  });

  it('parses stringified JSON recommendation objects', () => {
    const raw =
      '{"icon":"🧘‍♀️","title":"Morning stretch at home","tip":"Start your day with 10 minutes of gentle yoga."}';
    const item = normalizeRecommendationItem(raw);
    assert.equal(item.title, 'Morning stretch at home');
    assert.equal(item.tip, 'Start your day with 10 minutes of gentle yoga.');
    assert.equal(item.icon, '🧘‍♀️');
  });

  it('parses arrays of stringified recommendation objects', () => {
    const list = normalizeRecommendationsList([
      '{"icon":"🚶‍♂️","title":"Evening walks","tip":"Take a quiet 20-minute walk."}',
      '{"icon":"📖","title":"Cosy solo time","tip":"Set aside an hour to read."}',
    ]);
    assert.equal(list[0].title, 'Evening walks');
    assert.equal(list[1].tip, 'Set aside an hour to read.');
  });

  it('detects displayable recommendations', () => {
    assert.equal(hasDisplayableRecommendations([{ heading: 'Rest', body: 'Sleep early.' }]), true);
    assert.equal(hasDisplayableRecommendations([{}, {}]), false);
  });
});
