/**
 * Self-improving knowledge bank helpers.
 * Distill anonymized patterns from assessments and coach chats,
 * then retrieve similar examples for RAG-style prompt context.
 * Never store names, emails, or raw identifying answers.
 */

export const KNOWLEDGE_KINDS = [
  'question_pattern',
  'advice_pattern',
  'coach_pattern',
  'quality_rule',
];

const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_RE = /\b(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{4}\b/g;
const URL_RE = /https?:\/\/\S+/gi;

export function stripPii(text) {
  return String(text ?? '')
    .replace(EMAIL_RE, '[email]')
    .replace(URL_RE, '[link]')
    .replace(PHONE_RE, '[phone]')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function normalizeKnowledgeText(text) {
  return stripPii(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function fingerprintEntry({ kind, content, typeCode = '', dimension = '' }) {
  const key = `${kind}|${String(typeCode).toUpperCase()}|${String(dimension).toLowerCase()}|${normalizeKnowledgeText(content)}`;
  let h = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export function tokenize(text) {
  return normalizeKnowledgeText(text)
    .split(' ')
    .filter((t) => t.length > 2);
}

function overlapScore(queryTokens, content) {
  if (!queryTokens.length) return 0;
  const set = new Set(tokenize(content));
  let hits = 0;
  for (const t of queryTokens) {
    if (set.has(t)) hits += 1;
  }
  return hits / queryTokens.length;
}

/**
 * Rank candidate rows for a retrieval query.
 * Higher is better. Tag matches outweigh weak text overlap.
 */
export function rankKnowledgeEntries(entries, query = {}) {
  const {
    kind = null,
    kinds = null,
    burnoutCls = '',
    typeCode = '',
    dimension = '',
    workContext = '',
    queryText = '',
  } = query;
  const qTokens = tokenize(queryText);
  const kindAllow = kinds || (kind ? [kind] : null);

  return (entries ?? [])
    .map((row) => {
      let score = Number(row.qualityScore ?? row.quality_score ?? 0.5);
      const rowKind = row.kind;
      if (kindAllow && !kindAllow.includes(rowKind)) return { ...row, rank: -1 };

      if (burnoutCls && (row.burnoutCls || row.burnout_cls) === burnoutCls) score += 1.2;
      if (typeCode && String(row.typeCode || row.type_code || '').toUpperCase() === String(typeCode).toUpperCase()) {
        score += 1.1;
      }
      if (dimension && String(row.dimension || '').toLowerCase() === String(dimension).toLowerCase()) {
        score += 0.9;
      }
      if (workContext && (row.workContext || row.work_context) === workContext) score += 0.6;
      score += overlapScore(qTokens, row.content) * 1.4;
      score += Math.min(0.4, Number(row.successCount ?? row.success_count ?? 0) * 0.02);
      score += Math.min(0.2, Number(row.useCount ?? row.use_count ?? 0) * 0.005);
      return { ...row, rank: score };
    })
    .filter((r) => r.rank >= 0)
    .sort((a, b) => b.rank - a.rank);
}

export function formatKnowledgeForPrompt(entries, { limit = 6 } = {}) {
  const rows = (entries ?? []).slice(0, limit);
  if (!rows.length) return '';
  const lines = rows.map((e) => `- (${e.kind}) ${stripPii(e.content).slice(0, 280)}`);
  return [
    'Learned patterns from similar anonymized check-ins. Use them to write better questions, advice, or replies.',
    'Do not copy verbatim. Do not mention this list to the user. Ignore anything that does not fit this person.',
    ...lines,
  ].join('\n');
}

function discriminatingAnswers(answers) {
  if (!Array.isArray(answers) || answers.length < 4) return 0.4;
  const nums = answers.map(Number).filter(Number.isFinite);
  if (!nums.length) return 0.4;
  const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
  const variance = nums.reduce((a, b) => a + (b - mean) ** 2, 0) / nums.length;
  return Math.min(1, 0.45 + variance / 6);
}

/**
 * Build anonymized knowledge records from a completed assessment.
 */
export function buildAssessmentKnowledgeRecords({
  burnout,
  personality,
  burnoutQuestions,
  burnoutAnswers,
  personalityQuestions,
  recommendations,
  workContext,
  aiSource,
} = {}) {
  const records = [];
  const typeCode = personality?.typeCode || '';
  const burnoutCls = String(burnout?.cls || '').toLowerCase();
  const qualityBase = aiSource && !String(aiSource).includes('static') ? 0.72 : 0.5;
  const spread = discriminatingAnswers(burnoutAnswers);
  const quality = Math.min(1, (qualityBase + spread) / 2 + 0.15);

  (burnoutQuestions ?? []).forEach((q, i) => {
    const text = stripPii(q?.text || '');
    if (text.length < 12) return;
    const answer = Number(burnoutAnswers?.[i]);
    const extreme = answer === 0 || answer === 3;
    if (!extreme && spread < 0.55) return;
    const dimension = q.dimension || q.dimensionName || '';
    const content = `Effective ${dimension || 'burnout'} check-in item (${q.scale || 'agreement'}): ${text}`;
    records.push({
      kind: 'question_pattern',
      content,
      typeCode,
      burnoutCls,
      dimension: String(dimension).toLowerCase(),
      workContext: workContext || '',
      qualityScore: extreme ? Math.min(1, quality + 0.08) : quality,
    });
  });

  (personalityQuestions ?? []).slice(0, 4).forEach((q) => {
    const text = stripPii(q?.text || '');
    if (text.length < 12) return;
    records.push({
      kind: 'question_pattern',
      content: `Personality interview item (${q.dichotomy || q.scoredPole || 'trait'}): ${text}`,
      typeCode,
      burnoutCls,
      dimension: String(q.dichotomy || q.scoredPole || '').toLowerCase(),
      workContext: workContext || '',
      qualityScore: quality * 0.9,
    });
  });

  (recommendations ?? []).slice(0, 4).forEach((rec) => {
    const title = stripPii(rec?.title || '');
    const tip = stripPii(rec?.tip || rec?.protocol_rule || '');
    if (title.length < 4 || tip.length < 20) return;
    records.push({
      kind: 'advice_pattern',
      content: `For ${burnoutCls || 'this'} burnout and ${typeCode || 'this profile'}: ${title}. ${tip}`,
      typeCode,
      burnoutCls,
      dimension: '',
      workContext: workContext || '',
      qualityScore: quality,
    });
  });

  if (burnout?.summary && String(burnout.summary).length > 80) {
    records.push({
      kind: 'quality_rule',
      content: `Clear burnout explanation for ${burnoutCls || 'this range'} (${typeCode}): ${stripPii(String(burnout.summary)).slice(0, 420)}`,
      typeCode,
      burnoutCls,
      dimension: '',
      workContext: workContext || '',
      qualityScore: 0.65,
    });
  }

  return records.map((r) => ({
    ...r,
    fingerprint: fingerprintEntry(r),
  }));
}

/**
 * Store a coach pattern when the person acknowledges advice.
 */
export function buildCoachKnowledgeRecord({
  assistantReply,
  userMessage,
  burnoutCls,
  typeCode,
  workContext,
  adviceAcknowledged,
} = {}) {
  if (!adviceAcknowledged) return null;
  const reply = stripPii(assistantReply || '');
  if (reply.length < 40) return null;
  const theme = stripPii(userMessage || '').slice(0, 80);
  const content = `Coach reply that landed after "${theme || 'a check-in'}": ${reply.slice(0, 360)}`;
  const record = {
    kind: 'coach_pattern',
    content,
    typeCode: typeCode || '',
    burnoutCls: burnoutCls || '',
    dimension: '',
    workContext: workContext || '',
    qualityScore: 0.78,
  };
  return { ...record, fingerprint: fingerprintEntry(record) };
}

export function mapKnowledgeRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    kind: row.kind,
    content: row.content,
    typeCode: row.type_code || '',
    burnoutCls: row.burnout_cls || '',
    dimension: row.dimension || '',
    workContext: row.work_context || '',
    qualityScore: Number(row.quality_score ?? 0.5),
    useCount: Number(row.use_count ?? 0),
    successCount: Number(row.success_count ?? 0),
    createdAt: row.created_at,
  };
}
