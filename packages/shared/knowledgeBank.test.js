import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  stripPii,
  fingerprintEntry,
  rankKnowledgeEntries,
  formatKnowledgeForPrompt,
  buildAssessmentKnowledgeRecords,
  buildCoachKnowledgeRecord,
} from './knowledgeBank.js';

describe('knowledgeBank', () => {
  it('strips emails and phones from stored text', () => {
    const out = stripPii('Call me at 555-123-4567 or a@b.com');
    assert.equal(out.includes('a@b.com'), false);
    assert.equal(out.includes('555-123-4567'), false);
  });

  it('fingerprints are stable for the same pattern', () => {
    const a = fingerprintEntry({ kind: 'advice_pattern', content: 'Block thirty minutes of rest.', typeCode: 'INFJ' });
    const b = fingerprintEntry({ kind: 'advice_pattern', content: 'Block thirty minutes of rest!', typeCode: 'INFJ' });
    assert.equal(a, b);
  });

  it('ranks tag matches above unrelated rows', () => {
    const ranked = rankKnowledgeEntries(
      [
        { kind: 'advice_pattern', content: 'solo quiet rest', typeCode: 'INFJ', burnoutCls: 'moderate', qualityScore: 0.4 },
        { kind: 'advice_pattern', content: 'party recovery', typeCode: 'ESTP', burnoutCls: 'mild', qualityScore: 0.9 },
      ],
      { typeCode: 'INFJ', burnoutCls: 'moderate', kinds: ['advice_pattern'] },
    );
    assert.equal(ranked[0].typeCode, 'INFJ');
  });

  it('formats a prompt block without dumping empty lists', () => {
    assert.equal(formatKnowledgeForPrompt([]), '');
    const block = formatKnowledgeForPrompt([
      { kind: 'advice_pattern', content: 'Schedule rest on purpose.' },
    ]);
    assert.match(block, /Learned patterns/);
    assert.match(block, /Schedule rest/);
  });

  it('builds assessment records from extreme burnout answers', () => {
    const records = buildAssessmentKnowledgeRecords({
      burnout: { cls: 'moderate', summary: 'Your check-in sits in a moderate range with energy drain showing up most days of the week.' },
      personality: { typeCode: 'INFJ' },
      burnoutQuestions: [
        { text: 'I feel drained before the day is over.', dimension: 'exhaustion', scale: 'agreement' },
      ],
      burnoutAnswers: [3],
      recommendations: [{ title: 'Shrink the list', tip: 'Pick three priorities this week and defer the rest until next Monday.' }],
      workContext: 'employed',
      aiSource: 'gemini:gemini-2.5-flash-lite',
    });
    assert.ok(records.some((r) => r.kind === 'question_pattern'));
    assert.ok(records.some((r) => r.kind === 'advice_pattern'));
    assert.ok(records.every((r) => r.fingerprint));
  });

  it('only stores coach patterns when advice is acknowledged', () => {
    assert.equal(
      buildCoachKnowledgeRecord({
        assistantReply: 'Try a ten minute walk without your phone after lunch.',
        adviceAcknowledged: false,
      }),
      null,
    );
    const rec = buildCoachKnowledgeRecord({
      assistantReply: 'Try a ten minute walk without your phone after lunch today.',
      userMessage: 'that makes sense',
      adviceAcknowledged: true,
      typeCode: 'INFJ',
      burnoutCls: 'moderate',
    });
    assert.equal(rec.kind, 'coach_pattern');
  });
});
