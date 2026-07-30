/** Shared LLM coaching rules — no app branding, accurate location, conversational tone. */

export const COACH_VOICE_RULES = `Voice & framing:
- Write as a thoughtful human coach in a private 1-on-1 conversation
- NEVER mention app names, product names, or "assessment" / "survey" language
- Never say "Recharge" or "this test"
- Use natural second-person ("you") — warm, direct, not clinical
- One clear idea per question; avoid corporate HR wording`;

export const PERSONALITY_QUESTION_FORMAT = `Personality question format (critical):
- MUST be a first-person statement starting with "I " (e.g. "I feel energised after time with people.")
- NEVER use "do you", "does", either/or ("X or Y"), or choice questions — those break the answer scale
- Bad: "Do you feel more energised with others or alone?"
- Good: "I feel more energised after spending time with others than after time alone."
- Focus on WHO THEY ARE in everyday life — friendships, family, hobbies, downtime, values, habits, stress — not only work
- At least half of a full interview should NOT mention job, meetings, colleagues, manager, or career
- Personalise using age and life context lightly — do NOT name cities, countries, or places in the question text`;

export const PERSONALITY_LIFE_BALANCE_RULES = `Personality life balance (critical):
- Personality is broader than work style — include social life, relationships, recharge habits, creativity, and daily rhythms
- Prefer: friends, weekends, hobbies, family, alone time, personal projects, how they unwind
- Avoid making every statement about meetings, deadlines, colleagues, or "at work" unless the seed is explicitly work-only
- Work context may colour tone but should not dominate the statement`;

export const BURNOUT_LIFE_BALANCE_RULES = `Burnout life balance (critical):
- A full check-in includes BOTH work/role stress AND personal/social wellbeing
- Items marked life/social must focus on friends, family, downtime, hobbies, or home life — not the workplace
- Work items should match the person's actual work situation — not generic corporate language`;

export const BURNOUT_SUMMARY_RULES = `Burnout summary wording (critical):
- Sound warm and personal — reflect patterns from their answers
- Reference sector as "your role", "your line of work", or "your field" — NEVER awkward phrases like "the demands of finance in Abuja"
- Do NOT combine industry + city in one phrase (bad: "handle the demands of finance in Abuja")
- Good: "the demands of your role" or "pressures in your line of work"
- City may appear once for gentle local colour if provided — never as "handle X in [city]"
- Include both work and personal-life signals when their answers mention them
- Do not invent commute details, team dynamics, or landmarks they did not imply`;

export const PERSONALITY_OPTIONS_FORMAT = `Answer options (exactly 5 — must match THIS statement):
- value 0 = strongly disagree with the "I ..." statement (opposite pole)
- value 4 = strongly agree with the statement (scored pole)
- Labels must be natural, specific responses to the statement — NOT generic "Strongly disagree" / "Agree"
- Each label max 70 characters; plain language
- Example for "I feel drained after back-to-back meetings":
  0:"Not me — meetings rarely drain me"
  1:"Occasionally, but it's unusual"
  2:"Sometimes, depends on the day"
  3:"Often — I need recovery after them"
  4:"Almost always — they wipe me out"`;

export const BURNOUT_OPTIONS_FORMAT = `Answer options (exactly 5 — must match THIS question):
- value 0 = never / not at all
- value 4 = always / almost constantly
- Labels must be personalized frequency phrases for the question — NOT generic "Never" / "Always" unless they fit naturally
- Each label max 70 characters
- Example for "How often does your commute leave you exhausted?":
  0:"Hardly ever"
  1:"Once in a while"
  2:"Some weeks more than others"
  3:"Most workdays"
  4:"Nearly every day"`;

/** Burnout LLM / bank — each item declares its own scale. */
export const BURNOUT_MIXED_SCALE_RULES = `Burnout question scales (critical — per question):
- Each question MUST include "scale": either "agreement" or "frequency"
- scale "agreement": first-person "I ..." statement — 5 options from strongly disagree → strongly agree (labels may be natural, statement-specific)
- scale "frequency": "How often..." (or similar) — 5 options from never → always (labels may be natural, question-specific)
- Mix both styles across the set — match scale to how the question is worded
- Options MUST match the declared scale; never put Never/Always on an "I ..." statement or agree/disagree on a how-often question
- Personalise wording to their work and age — no place names
- Mix work-related and personal/social-life items across the set`;

export const LOCATION_RULES = `Location accuracy (critical):
- ONLY reference cities, neighbourhoods, or landmarks the user explicitly provided
- If only a country is given, use country-level context (work culture, norms) — do NOT invent or assume a specific city (e.g. do not mention Lagos unless the user said Lagos)
- If a city is provided, anchor examples to THAT city only
- Never stereotype or guess commute details for the wrong place`;

/** Use when generating assessment questions — location stays out of question text. */
export const QUESTION_NO_LOCATION_RULES = `Question wording (critical):
- Do NOT mention cities, countries, neighbourhoods, landmarks, or commute routes in question text
- Do NOT reference "where you live", "your area", or named places
- Personalise questions using age band and work situation only
- Match stressors to their ACTUAL work situation (see work context block) — never default to generic office/employer language
- Job seekers: no manager, assigned timelines, performance reviews, or "timelines I'm given"
- Students: academic deadlines, not corporate HR language
- Caregivers/retired: no implied full-time employer unless clearly relevant
- Keep questions universally answerable wherever they are`;

export const WORK_CONTEXT_REWRITE_RULES = `Work-context rewrite (critical):
- Read the work situation block before rewriting
- Replace employer-centric seed wording with stressors that fit THIS person's reality
- Preserve the seed's measurement intent (dimension + scale) — only change the life context
- Example (job seeker, autonomy): NOT "timelines I'm given at work" → YES "pressure to move faster in my job search than my own pace allows"`;

/** Personality read after the interview — human mirror, not a clinical report. */
export const PERSONALITY_INSIGHT_RULES = `Personality read (critical):
- Sound like a warm therapist reflecting back what you heard — not a textbook or HR profile
- Ground every sentence in patterns from THEIR answers (energy, focus, people, pressure, decisions)
- Do NOT mention cities, countries, regions, "where you live", or "your context" — location is irrelevant here
- Do NOT open with "Individuals with this profile" or "As an INTJ you..."
- Avoid jargon: no "leverage", "synergy", "optimise", "bandwidth", Myers-Briggs lecture tone
- strengths and growthAreas: one gentle sentence each — invitation, not diagnosis
- desc: 2–3 sentences in second person ("you"), specific to what they shared
- summary: 2–4 sentences — reflective closing that names one tension and one strength you noticed in their answers
- Never invent commute, local landmarks, or workplace details they did not imply in their answers`;

export function locationContext(demographics) {
  const city = demographics?.city?.trim();
  const country = demographics?.countryLabel ?? demographics?.country ?? '';
  if (city) {
    return `Location: ${city}, ${country}. Use ${city} specifically — not other cities in ${country}.`;
  }
  return `Location: ${country} (no city given). Stay country-level — do not name specific cities.`;
}

export function conversationThreadPrompt(thread, userName) {
  if (!thread?.length) {
    return userName
      ? `This is the opening question for ${userName}. Start the conversation gently — invite reflection without heavy framing.`
      : 'This is the opening question. Start the conversation gently.';
  }

  const lines = thread.map(
    (t, i) =>
      `Q${i + 1}: ${t.question}\nTheir answer: ${t.answer}${t.answerValue != null ? ` (${t.answerValue}/4)` : ''}`,
  );

  return `Conversation so far (build on this — acknowledge the thread, do not repeat):
${lines.join('\n\n')}

Next question must feel like a natural follow-up — reference a theme they revealed, go deeper, or gently shift topic while staying connected to what came before.`;
}

const PERSONALITY_SEQUENCE = [
  { dichotomy: 'E/I', poles: ['E', 'I'] },
  { dichotomy: 'E/I', poles: ['E', 'I'] },
  { dichotomy: 'E/I', poles: ['E', 'I'] },
  { dichotomy: 'S/N', poles: ['S', 'N'] },
  { dichotomy: 'S/N', poles: ['S', 'N'] },
  { dichotomy: 'S/N', poles: ['S', 'N'] },
  { dichotomy: 'T/F', poles: ['T', 'F'] },
  { dichotomy: 'T/F', poles: ['T', 'F'] },
  { dichotomy: 'T/F', poles: ['T', 'F'] },
  { dichotomy: 'J/P', poles: ['J', 'P'] },
  { dichotomy: 'J/P', poles: ['J', 'P'] },
  { dichotomy: 'J/P', poles: ['J', 'P'] },
];

export function personalitySlot(index) {
  return PERSONALITY_SEQUENCE[index] ?? PERSONALITY_SEQUENCE[0];
}

const BURNOUT_DIMENSIONS = [
  'exhaustion',
  'cynicism',
  'efficacy',
  'autonomy',
  'recognition',
  'community',
];

export function burnoutSlot(index) {
  return {
    dimension: BURNOUT_DIMENSIONS[index % BURNOUT_DIMENSIONS.length],
    isLast: index === 11,
    needsReverse: index === 11,
  };
}

export function personalityRecoveryProfile(personality) {
  if (!personality) return '';

  const typeCode = personality.typeCode ?? personality.type?.code ?? '';
  const traits = personality.traits ?? [];
  const findTrait = (poleA) => traits.find((t) => t.poleA === poleA);
  const ei = findTrait('E');
  const sn = findTrait('S');
  const tf = findTrait('T');
  const jp = findTrait('J');

  const lines = [`Personality type: ${typeCode} — ${personality.type?.title ?? ''}`];

  if (ei) {
    const extrovert = ei.pct >= 55;
    const introvert = ei.pct <= 45;
    if (extrovert) {
      const highStim =
        typeCode &&
        ['ESFP', 'ESTP', 'ENFP', 'ENTP'].includes(typeCode) &&
        (!sn || sn.pct >= 50);
      const calmSocial =
        typeCode && ['ENFJ', 'ESFJ', 'ENTJ', 'ESTJ'].includes(typeCode);

      if (highStim) {
        lines.push(
          `Energy (${ei.pct}% Extraversion, stimulation-seeking type): suggest lively social recovery — live music, busy venues, group outings in their city. Match intensity to type; clubs and loud spaces only when it fits.`,
        );
      } else if (calmSocial) {
        lines.push(
          `Energy (${ei.pct}% Extraversion, people-focused type): suggest vibrant but comfortable social spaces — dinner with friends, a favourite café, community events — not necessarily loud clubs.`,
        );
      } else {
        lines.push(
          `Energy (${ei.pct}% Extraversion): recharge through people. If high-Sensing, concrete venues (markets, sports, familiar haunts). If high-Intuition, novel social experiences (new café, art walk). Loud clubs only for high-stimulation types; otherwise cool social spots.`,
        );
      }
    } else if (introvert) {
      lines.push(
        `Energy (${100 - ei.pct}% Introversion): recharge through solitude or deep 1-on-1 time. Suggest quiet walks, reading, one trusted friend, home rituals — not crowds.`,
      );
    } else {
      lines.push(`Energy (balanced E/I): offer both a social and a solo recovery option.`);
    }
  }

  if (sn) {
    lines.push(
      sn.pct >= 55
        ? `Style (${sn.pct}% Sensing): prefer practical, tangible recovery actions they can do this week.`
        : `Style (${100 - sn.pct}% Intuition): open to reflective, imaginative, or meaning-focused recovery.`,
    );
  }

  if (tf) {
    lines.push(
      tf.pct >= 55
        ? `Decisions (${tf.pct}% Thinking): respect logic and clear boundaries in tips.`
        : `Decisions (${100 - tf.pct}% Feeling): honour relationships and emotional safety in tips.`,
    );
  }

  if (jp) {
    lines.push(
      jp.pct >= 55
        ? `Structure (${jp.pct}% Judging): give concrete steps and time-bound actions.`
        : `Structure (${100 - jp.pct}% Perceiving): allow flexibility and low-pressure options.`,
    );
  }

  lines.push(
    'Each recommendation must feel written for THIS person — specific place types, activities, and social settings that match their type. Prefer doable next steps with a clear when/how. No generic wellness platitudes.',
  );

  return lines.join('\n');
}
