import {
  buildFallbackBurnoutQuestions,
  buildFallbackPersonalityQuestions,
} from '@recharge/shared/fallbackQuestions';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

const CACHE_MS = Number(process.env.QUESTION_BANK_CACHE_MS) || 300_000;
const PERSONALITY_COUNT = 12;
const PERSONALITY_PER_DICHOTOMY = 3;
const BURNOUT_COUNT = 12;
const BURNOUT_PER_DIMENSION = 2;
const MIN_PERSONALITY_BANK = 120;

const DICHOTOMY_CODES = ['E/I', 'S/N', 'T/F', 'J/P'];

const DIMENSION_SLUGS = {
  Exhaustion: 'exhaustion',
  Cynicism: 'cynicism',
  Efficacy: 'efficacy',
  Autonomy: 'autonomy',
  Recognition: 'recognition',
  Community: 'community',
};

const cache = {
  personalityQuestions: null,
  personalityOptions: null,
  burnoutQuestions: null,
  burnoutOptions: null,
  typeProfiles: new Map(),
  fetchedAt: 0,
};

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function selectBalancedPersonalityQuestions(allQuestions) {
  const byDichotomy = new Map();
  for (const q of allQuestions) {
    const key = q.dichotomy;
    if (!byDichotomy.has(key)) byDichotomy.set(key, []);
    byDichotomy.get(key).push(q);
  }

  const selected = [];
  for (const code of DICHOTOMY_CODES) {
    const group = byDichotomy.get(code) ?? [];
    selected.push(...shuffle(group).slice(0, PERSONALITY_PER_DICHOTOMY));
  }

  if (selected.length < PERSONALITY_COUNT) {
    throw new Error(`Could not select ${PERSONALITY_COUNT} balanced personality questions`);
  }

  return shuffle(selected).slice(0, PERSONALITY_COUNT);
}

function formatPersonalitySelection(questions, options) {
  return questions.map((q, i) => ({
    id: `bank-p${i + 1}`,
    bankId: q.id,
    text: q.question_text,
    scoredPole: q.scored_pole,
    dichotomy: q.dichotomy,
    scale: 'agreement',
    options: options.map((o) => ({ value: o.value, label: o.label })),
  }));
}

function formatBurnoutSelection(questions, options) {
  return questions.map((q, i) => ({
    id: `bank-b${i + 1}`,
    bankId: q.id,
    text: q.question_text,
    dimension: DIMENSION_SLUGS[q.dimension] ?? q.dimension?.toLowerCase(),
    dimensionName: q.dimension,
    reverseScored: false,
    scale: 'frequency',
    options: options.map((o) => ({ value: o.value, label: o.label })),
  }));
}

function selectBalancedBurnoutQuestions(allQuestions) {
  const byDimension = new Map();
  for (const q of allQuestions) {
    const key = q.dimension_id ?? q.dimension;
    if (!byDimension.has(key)) byDimension.set(key, []);
    byDimension.get(key).push(q);
  }

  const selected = [];
  for (const group of byDimension.values()) {
    selected.push(...shuffle(group).slice(0, BURNOUT_PER_DIMENSION));
  }

  if (selected.length < BURNOUT_COUNT) {
    throw new Error(`Could not select ${BURNOUT_COUNT} balanced burnout questions`);
  }

  return shuffle(selected).slice(0, BURNOUT_COUNT);
}

async function loadPersonalityBank() {
  const now = Date.now();
  if (
    cache.personalityQuestions &&
    cache.personalityOptions &&
    now - cache.fetchedAt < CACHE_MS
  ) {
    return {
      questions: cache.personalityQuestions,
      options: cache.personalityOptions,
    };
  }

  const { data: options, error: optErr } = await supabase
    .from('personality_options')
    .select('value, label')
    .order('value', { ascending: true });

  if (optErr) throw optErr;
  if (!options?.length) throw new Error('No personality options in bank');

  const { data: questions, error: qErr } = await supabase
    .from('personality_questions_full')
    .select('id, question_number, question_text, scored_pole, dichotomy');

  if (qErr) throw qErr;
  if ((questions?.length ?? 0) < MIN_PERSONALITY_BANK) {
    throw new Error(`Personality bank has ${questions?.length ?? 0} questions`);
  }

  cache.personalityQuestions = questions;
  cache.personalityOptions = options;
  cache.fetchedAt = now;

  return { questions, options };
}

async function loadBurnoutBank() {
  const now = Date.now();
  if (
    cache.burnoutQuestions &&
    cache.burnoutOptions &&
    now - cache.fetchedAt < CACHE_MS
  ) {
    return {
      questions: cache.burnoutQuestions,
      options: cache.burnoutOptions,
    };
  }

  const { data: options, error: optErr } = await supabase
    .from('burnout_options')
    .select('value, label')
    .order('value', { ascending: true });

  if (optErr) throw optErr;
  if (!options?.length) throw new Error('No burnout options in bank');

  const { data: questions, error: qErr } = await supabase
    .from('burnout_questions_full')
    .select(
      'id, question_number, question_text, dimension_id, dimension, dimension_description',
    );

  if (qErr) throw qErr;
  if ((questions?.length ?? 0) < BURNOUT_COUNT) {
    throw new Error(`Burnout bank has ${questions?.length ?? 0} questions`);
  }

  cache.burnoutQuestions = questions;
  cache.burnoutOptions = options;
  cache.fetchedAt = now;

  return { questions, options };
}

export function clearQuestionBankCache() {
  cache.personalityQuestions = null;
  cache.personalityOptions = null;
  cache.burnoutQuestions = null;
  cache.burnoutOptions = null;
  cache.typeProfiles.clear();
  cache.fetchedAt = 0;
}

export async function getMbtiTypeProfile(typeCode) {
  const code = String(typeCode).toUpperCase();
  if (cache.typeProfiles.has(code)) {
    return cache.typeProfiles.get(code);
  }

  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('personality_types')
    .select('code, title, archetype, description, strengths, growth_areas')
    .eq('code', code)
    .maybeSingle();

  if (error) throw error;
  if (data) cache.typeProfiles.set(code, data);
  return data;
}

export async function getPersonalityBankQuestions() {
  if (!isSupabaseConfigured()) {
    console.warn('Question bank unavailable — Supabase not configured');
    return { questions: buildFallbackPersonalityQuestions(), source: 'static-fallback' };
  }

  try {
    const { questions, options } = await loadPersonalityBank();
    const picked = selectBalancedPersonalityQuestions(questions);
    return {
      questions: formatPersonalitySelection(picked, options),
      source: 'bank',
    };
  } catch (err) {
    console.error('Personality question bank failed:', err.message);
    return { questions: buildFallbackPersonalityQuestions(), source: 'static-fallback' };
  }
}

export async function getBurnoutBankQuestions() {
  if (!isSupabaseConfigured()) {
    console.warn('Question bank unavailable — Supabase not configured');
    return { questions: buildFallbackBurnoutQuestions(), source: 'static-fallback' };
  }

  try {
    const { questions, options } = await loadBurnoutBank();
    const picked = selectBalancedBurnoutQuestions(questions);
    return {
      questions: formatBurnoutSelection(picked, options),
      source: 'bank',
    };
  } catch (err) {
    console.error('Burnout question bank failed:', err.message);
    return { questions: buildFallbackBurnoutQuestions(), source: 'static-fallback' };
  }
}

export async function checkQuestionBankHealth() {
  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      connected: false,
      personality: 0,
      personalityDichotomies: 0,
      personalityOptions: 0,
      personalityTypes: 0,
      burnout: 0,
      burnoutDimensions: 0,
      burnoutOptions: 0,
      ready: false,
      error: null,
    };
  }

  try {
    const { count: personality, error: pErr } = await supabase
      .from('personality_questions')
      .select('id', { count: 'exact', head: true });

    if (pErr) throw pErr;

    const { count: dichotomies, error: dErr } = await supabase
      .from('personality_dichotomies')
      .select('id', { count: 'exact', head: true });

    if (dErr) throw dErr;

    const { count: pOptions, error: poErr } = await supabase
      .from('personality_options')
      .select('id', { count: 'exact', head: true });

    if (poErr) throw poErr;

    const { count: types, error: tErr } = await supabase
      .from('personality_types')
      .select('id', { count: 'exact', head: true });

    if (tErr) throw tErr;

    const { count: burnout, error: bErr } = await supabase
      .from('burnout_questions')
      .select('id', { count: 'exact', head: true });

    if (bErr) throw bErr;

    const { count: dimensions, error: bdErr } = await supabase
      .from('burnout_dimensions')
      .select('id', { count: 'exact', head: true });

    if (bdErr) throw bdErr;

    const { count: options, error: oErr } = await supabase
      .from('burnout_options')
      .select('id', { count: 'exact', head: true });

    if (oErr) throw oErr;

    const ready =
      (personality ?? 0) >= MIN_PERSONALITY_BANK &&
      (dichotomies ?? 0) >= 4 &&
      (pOptions ?? 0) >= 5 &&
      (types ?? 0) >= 16 &&
      (burnout ?? 0) >= BURNOUT_COUNT &&
      (dimensions ?? 0) >= 6 &&
      (options ?? 0) >= 5;

    return {
      configured: true,
      connected: true,
      personality: personality ?? 0,
      personalityDichotomies: dichotomies ?? 0,
      personalityOptions: pOptions ?? 0,
      personalityTypes: types ?? 0,
      burnout: burnout ?? 0,
      burnoutDimensions: dimensions ?? 0,
      burnoutOptions: options ?? 0,
      ready,
      error: null,
    };
  } catch (err) {
    return {
      configured: true,
      connected: false,
      personality: 0,
      personalityDichotomies: 0,
      personalityOptions: 0,
      personalityTypes: 0,
      burnout: 0,
      burnoutDimensions: 0,
      burnoutOptions: 0,
      ready: false,
      error: err.message,
    };
  }
}
