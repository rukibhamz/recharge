import {
  buildAssessmentKnowledgeRecords,
  buildCoachKnowledgeRecord,
  formatKnowledgeForPrompt,
  mapKnowledgeRow,
  rankKnowledgeEntries,
} from '@recharge/shared/knowledgeBank';
import { llmFeatures } from '../config/llm.js';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

const CACHE_MS = Number(process.env.KNOWLEDGE_BANK_CACHE_MS) || 60_000;
const RETRIEVE_POOL = 180;
const RETRIEVE_LIMIT = 6;

const cache = {
  rows: null,
  fetchedAt: 0,
};

function knowledgeEnabled() {
  return llmFeatures.knowledgeLoop !== false;
}

function invalidateCache() {
  cache.rows = null;
  cache.fetchedAt = 0;
}

async function loadPool() {
  if (!isSupabaseConfigured() || !knowledgeEnabled()) return [];
  const now = Date.now();
  if (cache.rows && now - cache.fetchedAt < CACHE_MS) return cache.rows;

  const { data, error } = await supabase
    .from('ai_knowledge_entries')
    .select(
      'id, fingerprint, kind, content, type_code, burnout_cls, dimension, work_context, quality_score, use_count, success_count, created_at',
    )
    .order('quality_score', { ascending: false })
    .limit(RETRIEVE_POOL);

  if (error) {
    if (/ai_knowledge_entries|42P01/i.test(error.message)) {
      console.warn('[knowledge-bank] table missing. Run migration 017_ai_knowledge_bank.sql');
      cache.rows = [];
      cache.fetchedAt = now;
      return [];
    }
    console.warn('[knowledge-bank] load failed:', error.message);
    return cache.rows ?? [];
  }

  cache.rows = (data ?? []).map(mapKnowledgeRow).filter(Boolean);
  cache.fetchedAt = now;
  return cache.rows;
}

export async function retrieveKnowledgeContext(query = {}, { limit = RETRIEVE_LIMIT } = {}) {
  if (!knowledgeEnabled()) return { entries: [], block: '' };
  try {
    const pool = await loadPool();
    const ranked = rankKnowledgeEntries(pool, query).slice(0, limit);
    return {
      entries: ranked,
      block: formatKnowledgeForPrompt(ranked, { limit }),
    };
  } catch (err) {
    console.warn('[knowledge-bank] retrieve failed:', err.message);
    return { entries: [], block: '' };
  }
}

async function upsertRecords(records, source) {
  if (!isSupabaseConfigured() || !knowledgeEnabled() || !records?.length) return 0;
  let saved = 0;
  for (const rec of records) {
    const payload = {
      fingerprint: rec.fingerprint,
      kind: rec.kind,
      content: rec.content.slice(0, 800),
      type_code: rec.typeCode || '',
      burnout_cls: rec.burnoutCls || '',
      dimension: rec.dimension || '',
      work_context: rec.workContext || '',
      quality_score: rec.qualityScore,
      source,
      updated_at: new Date().toISOString(),
    };

    const { data: existing, error: findErr } = await supabase
      .from('ai_knowledge_entries')
      .select('id, success_count, quality_score')
      .eq('fingerprint', rec.fingerprint)
      .maybeSingle();

    if (findErr) {
      if (/ai_knowledge_entries|42P01/i.test(findErr.message)) return 0;
      console.warn('[knowledge-bank] lookup failed:', findErr.message);
      continue;
    }

    if (existing?.id) {
      const { error } = await supabase
        .from('ai_knowledge_entries')
        .update({
          success_count: (existing.success_count ?? 0) + 1,
          quality_score: Math.min(1, Number(existing.quality_score ?? 0.5) + 0.02),
          updated_at: payload.updated_at,
        })
        .eq('id', existing.id);
      if (!error) saved += 1;
    } else {
      const { error } = await supabase.from('ai_knowledge_entries').insert({
        ...payload,
        success_count: 1,
      });
      if (!error) saved += 1;
    }
  }
  if (saved) invalidateCache();
  return saved;
}

export function ingestAssessmentKnowledge(payload) {
  if (!knowledgeEnabled()) return;
  void (async () => {
    try {
      const records = buildAssessmentKnowledgeRecords(payload);
      const n = await upsertRecords(records, 'assessment');
      if (n) console.log(`[knowledge-bank] ingested ${n} assessment patterns`);
    } catch (err) {
      console.warn('[knowledge-bank] assessment ingest failed:', err.message);
    }
  })();
}

export function ingestCoachKnowledge(payload) {
  if (!knowledgeEnabled()) return;
  void (async () => {
    try {
      const record = buildCoachKnowledgeRecord(payload);
      if (!record) return;
      const n = await upsertRecords([record], 'coach');
      if (n) console.log('[knowledge-bank] ingested coach pattern');
    } catch (err) {
      console.warn('[knowledge-bank] coach ingest failed:', err.message);
    }
  })();
}

export async function getKnowledgeBankStats() {
  if (!isSupabaseConfigured()) {
    return { ready: false, total: 0, byKind: {}, hint: 'Supabase not configured' };
  }
  const { data, error, count } = await supabase
    .from('ai_knowledge_entries')
    .select('kind', { count: 'exact' });

  if (error) {
    return {
      ready: false,
      total: 0,
      byKind: {},
      hint: /42P01|ai_knowledge_entries/i.test(error.message)
        ? 'Run migration 017_ai_knowledge_bank.sql in Supabase'
        : error.message,
    };
  }

  const byKind = {};
  for (const row of data ?? []) {
    byKind[row.kind] = (byKind[row.kind] ?? 0) + 1;
  }
  return {
    ready: true,
    total: count ?? (data ?? []).length,
    byKind,
    enabled: knowledgeEnabled(),
  };
}
