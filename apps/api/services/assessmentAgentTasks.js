import {
  COACH_VOICE_RULES,
  PERSONALITY_QUESTION_FORMAT,
  PERSONALITY_INSIGHT_RULES,
  QUESTION_NO_LOCATION_RULES,
  BURNOUT_MIXED_SCALE_RULES,
  WORK_CONTEXT_REWRITE_RULES,
  personalityRecoveryProfile,
} from '@recharge/shared/promptCoaching';
import {
  burnoutDimensionCoaching,
  workContextLanguageViolation,
} from '@recharge/shared/workContextCoaching';
import { firstName } from '@recharge/shared/name';

const VALID_POLES = new Set(['E', 'I', 'S', 'N', 'T', 'F', 'J', 'P']);
const VALID_SCALES = new Set(['agreement', 'frequency']);

function isIStatement(text) {
  return /^i\s/i.test(String(text ?? '').trim());
}

export const ASSESSMENT_TASKS = {
  rewritePersonalityQuestion: {
    id: 'rewritePersonalityQuestion',
    buildPrompt(input) {
      const { anchor, userContext, userName } = input;
      const name = firstName(userName);
      return `Rewrite this personality interview statement for ${name || 'this person'}. Keep the SAME psychological meaning and scored pole.

${userContext}

${COACH_VOICE_RULES}
${PERSONALITY_QUESTION_FORMAT}
${QUESTION_NO_LOCATION_RULES}
${WORK_CONTEXT_REWRITE_RULES}

Seed statement (do not change meaning):
"${anchor.seedText}"

Locked scoring metadata (echo exactly):
- scoredPole: ${anchor.scoredPole}
- dichotomy: ${anchor.dichotomy}

Rules:
- Output ONE first-person "I ..." statement
- Personalise wording to their work situation (see block above) — no place names
- If the seed implies an employer but this person is NOT employed, rewrite to their real context (job search, study, caregiving, etc.)
- Do NOT invent a new trait; keep the seed meaning

Return JSON only:
{"text":"I ...","scoredPole":"${anchor.scoredPole}","dichotomy":"${anchor.dichotomy}"}`;
    },
    validate(parsed, input) {
      const errors = [];
      const text = String(parsed?.text ?? parsed?.question ?? '').trim();
      if (text.length < 8) errors.push('text too short');
      if (!isIStatement(text)) errors.push('text must start with "I "');
      const scoredPole = String(parsed?.scoredPole ?? parsed?.scored_pole ?? '').toUpperCase();
      if (scoredPole !== input.anchor.scoredPole) {
        errors.push(`scoredPole must be ${input.anchor.scoredPole}`);
      }
      if (!VALID_POLES.has(scoredPole)) errors.push('invalid scoredPole');
      const contextError = workContextLanguageViolation(text, input.workContext);
      if (contextError) errors.push(contextError);
      const dichotomy = String(parsed?.dichotomy ?? input.anchor.dichotomy);
      if (dichotomy !== input.anchor.dichotomy) {
        errors.push(`dichotomy must be ${input.anchor.dichotomy}`);
      }
      return {
        ok: errors.length === 0,
        errors,
        value: errors.length
          ? null
          : {
              text,
              scoredPole: input.anchor.scoredPole,
              dichotomy: input.anchor.dichotomy,
            },
      };
    },
    fallback(input) {
      return {
        text: input.anchor.seedText,
        scoredPole: input.anchor.scoredPole,
        dichotomy: input.anchor.dichotomy,
      };
    },
    repairPrompt(errors, input) {
      return `Your previous JSON was invalid: ${errors.join('; ')}.
Rewrite again. Echo scoredPole="${input.anchor.scoredPole}" and dichotomy="${input.anchor.dichotomy}" exactly.
Seed: "${input.anchor.seedText}"
Return JSON only: {"text":"I ...","scoredPole":"${input.anchor.scoredPole}","dichotomy":"${input.anchor.dichotomy}"}`;
    },
  },

  rewriteBurnoutQuestion: {
    id: 'rewriteBurnoutQuestion',
    buildPrompt(input) {
      const { anchor, userContext, userName, personality } = input;
      const name = firstName(userName);
      const recovery = personalityRecoveryProfile(personality);
      const scaleHint =
        anchor.scale === 'frequency'
          ? 'Use a "How often..." style frequency question.'
          : 'Use a first-person "I ..." agreement statement.';
      const dimensionGuide = burnoutDimensionCoaching(input.workContext, anchor.dimension);

      return `Rewrite this burnout check-in item for ${name || 'this person'}. Keep the SAME measurement intent and dimension.

${userContext}
${dimensionGuide ? `\n${dimensionGuide}\n` : ''}
Personality (colour tone only — do not change what is measured):
${recovery || `${personality?.typeCode ?? ''} — ${personality?.summary ?? ''}`}

${COACH_VOICE_RULES}
${BURNOUT_MIXED_SCALE_RULES}
${QUESTION_NO_LOCATION_RULES}
${WORK_CONTEXT_REWRITE_RULES}

Seed:
"${anchor.seedText}"

Locked metadata (echo exactly):
- dimension: ${anchor.dimension}
- scale: ${anchor.scale}
- reverseScored: ${Boolean(anchor.reverseScored)}

${scaleHint}

Rules:
- Personalise to their work situation — replace employer/office wording when it does not fit
- For job seekers: stressors are search pace, rejection, finances, unstructured days — NOT manager timelines
- Keep the same burnout dimension and scale as the seed

Return JSON only:
{"text":"...","scale":"${anchor.scale}","dimension":"${anchor.dimension}","reverseScored":${Boolean(anchor.reverseScored)}}`;
    },
    validate(parsed, input) {
      const errors = [];
      const text = String(parsed?.text ?? parsed?.question ?? '').trim();
      if (text.length < 8) errors.push('text too short');
      const scale = String(parsed?.scale ?? '').toLowerCase();
      if (scale !== input.anchor.scale) errors.push(`scale must be ${input.anchor.scale}`);
      if (!VALID_SCALES.has(scale)) errors.push('invalid scale');
      if (scale === 'agreement' && !isIStatement(text)) {
        errors.push('agreement items must start with "I "');
      }
      const dimension = String(parsed?.dimension ?? '').toLowerCase();
      if (dimension && dimension !== String(input.anchor.dimension).toLowerCase()) {
        errors.push(`dimension must be ${input.anchor.dimension}`);
      }
      const contextError = workContextLanguageViolation(text, input.workContext);
      if (contextError) errors.push(contextError);
      return {
        ok: errors.length === 0,
        errors,
        value: errors.length
          ? null
          : {
              text,
              scale: input.anchor.scale,
              dimension: input.anchor.dimension,
              reverseScored: Boolean(input.anchor.reverseScored),
            },
      };
    },
    fallback(input) {
      return {
        text: input.anchor.seedText,
        scale: input.anchor.scale,
        dimension: input.anchor.dimension,
        reverseScored: Boolean(input.anchor.reverseScored),
      };
    },
    repairPrompt(errors, input) {
      const contextFix =
        input.workContext === 'between_roles' &&
        errors.some((e) => /employment|job seeker|between_roles/i.test(e))
          ? '\nThis person is job seeking — remove employer/manager/timeline-given language. Use job search pace, rejection, finances, unstructured days instead.'
          : '';
      return `Your previous JSON was invalid: ${errors.join('; ')}.
Rewrite again. Echo scale="${input.anchor.scale}" and dimension="${input.anchor.dimension}".${contextFix}
Seed: "${input.anchor.seedText}"
Return JSON only: {"text":"...","scale":"${input.anchor.scale}","dimension":"${input.anchor.dimension}","reverseScored":${Boolean(input.anchor.reverseScored)}}`;
    },
  },

  writePersonalityNarrative: {
    id: 'writePersonalityNarrative',
    buildPrompt(input) {
      const { insightContext, qaBlock, typeCode, traits, typeProfile } = input;
      const traitLines = (traits ?? [])
        .map((t) => `${t.name}: ${t.pct}% toward ${t.poleA} (vs ${t.poleB})`)
        .join('\n');

      return `You are a skilled therapist reflecting on a personality interview. The type is ALREADY determined — do not change it.

${insightContext}

${PERSONALITY_INSIGHT_RULES}

LOCKED type (do not change): ${typeCode} — ${typeProfile?.title ?? ''}
LOCKED traits:
${traitLines}

Interview:
${qaBlock}

Write warm, second-person copy only. Do NOT invent a different typeCode or change trait percentages.

Return JSON only:
{"type":{"title":"${typeProfile?.title ?? ''}","archetype":"${typeProfile?.archetype ?? ''}","desc":"2-3 sentences, second person, tied to their answers","strengths":"One gentle sentence","growthAreas":"One gentle sentence","icon":"🌟"},"summary":"2-4 reflective sentences — themes from their answers, no type-code lecture, no places"}`;
    },
    validate(parsed) {
      const errors = [];
      const type = parsed?.type ?? {};
      const desc = String(type.desc ?? type.description ?? '').trim();
      const summary = String(parsed?.summary ?? '').trim();
      if (desc.length < 20 && summary.length < 20) {
        errors.push('narrative too short');
      }
      return {
        ok: errors.length === 0,
        errors,
        value: errors.length
          ? null
          : {
              type: {
                title: type.title ?? '',
                archetype: type.archetype ?? '',
                desc: desc || summary,
                strengths: type.strengths ?? '',
                growthAreas: type.growthAreas ?? type.growth_areas ?? '',
                icon: type.icon ?? '✨',
              },
              summary: summary || desc,
            },
      };
    },
    fallback(input) {
      const profile = input.typeProfile ?? {};
      const desc =
        profile.description?.trim() ||
        `Your responses align with the ${input.typeCode} personality pattern.`;
      return {
        type: {
          title: profile.title ?? '',
          archetype: profile.archetype ?? '',
          desc,
          strengths: profile.strengths ?? '',
          growthAreas: profile.growth_areas ?? '',
          icon: '✨',
        },
        summary: desc,
      };
    },
    repairPrompt(errors) {
      return `Your previous JSON was invalid: ${errors.join('; ')}.
Return narrative only — do not include typeCode or trait percentages.
Return JSON only: {"type":{"title":"...","archetype":"...","desc":"...","strengths":"...","growthAreas":"...","icon":"..."},"summary":"..."}`;
    },
  },

  writeBurnoutSummary: {
    id: 'writeBurnoutSummary',
    buildPrompt(input) {
      const { userContext, qaBlock, personality, calibrated } = input;
      return `You are a burnout specialist explaining an already-computed check-in result.

${userContext}

Personality: ${personality?.typeCode ?? ''} — ${personality?.summary ?? ''}

LOCKED result (do not change numbers or class):
- pct: ${calibrated.pct}
- cls: ${calibrated.cls}
- level: ${calibrated.level}
- rawPct: ${calibrated.rawPct}
${calibrated.calibrationNote ? `- note: ${calibrated.calibrationNote}` : ''}

Their answers:
${qaBlock}

Write 2–3 warm sentences explaining what you see and why this level fits THEM (personality-aware). Do NOT invent a different pct or cls.

Return JSON only:
{"summary":"..."}`;
    },
    validate(parsed) {
      const summary = String(parsed?.summary ?? '').trim();
      const errors = [];
      if (summary.length < 20) errors.push('summary too short');
      return {
        ok: errors.length === 0,
        errors,
        value: errors.length ? null : { summary },
      };
    },
    fallback(input) {
      const c = input.calibrated;
      return {
        summary: `Based on your check-in, your burnout score is ${c.pct}% (${c.level})${
          c.calibrationNote ? ` — ${c.calibrationNote}` : ''
        }.`,
      };
    },
    repairPrompt(errors, input) {
      return `Your previous JSON was invalid: ${errors.join('; ')}.
Write summary only. Do not change pct=${input.calibrated.pct} or cls=${input.calibrated.cls}.
Return JSON only: {"summary":"..."}`;
    },
  },
};

export function getAssessmentTask(taskId) {
  return ASSESSMENT_TASKS[taskId] ?? null;
}
