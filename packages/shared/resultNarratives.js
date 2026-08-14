/**
 * Structured burnout + moodboard copy from score dimensions and personality.
 * Used when LLM summary is missing, too generic, or too dense for the results page.
 */

const DIMENSION_LABELS = {
  exhaustion: 'energy drain',
  emotional_exhaustion: 'energy drain',
  cynicism: 'emotional distance',
  depersonalisation: 'emotional distance',
  efficacy: 'sense of accomplishment',
  personal_accomplishment: 'sense of accomplishment',
  autonomy: 'control over your work',
  recognition: 'feeling valued',
  community: 'support and belonging',
  overall: 'overall load',
};

const DRIVER_PLAIN = {
  exhaustion:
    "you're running low on fuel. Tasks and demands are costing you more than you're getting back.",
  emotional_exhaustion:
    "you're running low on fuel. Tasks and demands are costing you more than you're getting back.",
  community:
    "you may be feeling like you're carrying things alone, without enough people to lean on or check in with.",
  cynicism:
    "work or daily demands may feel more distant or harder to care about than usual. That distance is a strain signal, not a character flaw.",
  depersonalisation:
    "work or daily demands may feel more distant or harder to care about than usual. That distance is a strain signal, not a character flaw.",
  autonomy:
    "you may feel boxed in, with too little say over pace, priorities, or how the day unfolds.",
  recognition:
    "effort may not be landing as appreciation. Feeling unseen quietly adds to the load.",
  efficacy:
    "it may be harder to feel that what you do is moving anything forward. That gap between effort and progress is draining.",
  personal_accomplishment:
    "it may be harder to feel that what you do is moving anything forward. That gap between effort and progress is draining.",
};

const GENERIC_SUMMARY_PATTERNS = [
  /\bexpected targets?\b/i,
  /\bperformance\b/i,
  /\boptimal outcomes?\b/i,
  /\bkey performance\b/i,
  /\bdata indicates\b/i,
  /\bnotable progress\b/i,
  /\bstrategies for enhancement\b/i,
  /\blevel of performance\b/i,
  /\bachieved\b.*\b%/i,
  /\bKPI\b/i,
  /\broi\b/i,
  /\bstakeholders?\b/i,
  /\bleverage\b/i,
  /\bsynerg/i,
  /\bvisual layer for your result\b/i,
];

export function stripEmDashes(text) {
  return String(text ?? '')
    .replace(/\u2014/g, ', ')
    .replace(/\u2013/g, '-')
    .replace(/\s+,/g, ',')
    .replace(/,\s*,/g, ',')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function isGenericBurnoutSummary(text) {
  const s = String(text ?? '').trim();
  if (s.length < 40) return true;
  return GENERIC_SUMMARY_PATTERNS.some((re) => re.test(s));
}

/** Highest-load dimensions first. */
export function topLoadDimensions(dimensions, limit = 2) {
  if (!dimensions || typeof dimensions !== 'object') return [];
  const rows = Object.entries(dimensions)
    .map(([key, score]) => ({ key, score: Number(score) }))
    .filter((r) => Number.isFinite(r.score) && r.key !== 'overall')
    .map((r) => {
      if (r.key === 'personal_accomplishment' || r.key === 'efficacy') {
        return { key: r.key, score: 100 - r.score, inverted: true, raw: r.score };
      }
      return { key: r.key, score: r.score, inverted: false, raw: r.score };
    })
    .filter((r) => r.score >= 28)
    .sort((a, b) => b.score - a.score);
  return rows.slice(0, limit);
}

function labelDim(key) {
  return DIMENSION_LABELS[key] || key.replace(/_/g, ' ');
}

function capitalize(s) {
  const t = String(s ?? '');
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : '';
}

function typeNameOf(personality) {
  return personality?.type?.title || personality?.type?.name || personality?.typeCode || '';
}

function traitPole(traits, poleA) {
  return traits?.find((t) => t.poleA === poleA);
}

function leanPct(towardA, poleAPct) {
  const a = Number(poleAPct);
  if (!Number.isFinite(a)) return 50;
  return towardA ? a : 100 - a;
}

function scoreMeaning(cls, pct, level) {
  const n = Math.round(Number(pct) || 0);
  const label = level || 'this range';
  if (cls === 'healthy') {
    return `Based on your answers, you are not in a deep burnout range right now. ${n}% (${label}) still means it is worth protecting rest and boundaries so this stays low.`;
  }
  if (cls === 'mild') {
    return `Based on your answers, load is rising. ${n}% (${label}) is not a crisis, but more of your day is running on strain than reserve. It is a useful early warning.`;
  }
  if (cls === 'severe') {
    return `Based on your answers, strain is high. ${n}% (${label}) is a strong signal to reduce load and get support, not to push harder. This is information to act on, not a label.`;
  }
  return `Based on your answers, you're carrying a noticeable amount of ongoing stress. Not crisis-level, but enough that it's affecting how you feel day to day. It's a warning sign worth paying attention to, not an emergency.`;
}

function driverItem(row) {
  const name = labelDim(row.key);
  const plain = DRIVER_PLAIN[row.key] || `this area is showing more strain than the rest of your check-in.`;
  return {
    title: capitalize(name),
    body: stripEmDashes(plain),
  };
}

function profileNote(personality) {
  const traits = personality?.traits ?? [];
  const name = typeNameOf(personality);
  const ei = traitPole(traits, 'E');
  const jp = traitPole(traits, 'J');
  const tf = traitPole(traits, 'T');
  const parts = [];

  if (ei) {
    if (ei.pct <= 45) {
      parts.push(
        'you likely recharge best with quiet, low-stimulation downtime, not parties or packed social calendars.',
      );
    } else if (ei.pct >= 55) {
      parts.push(
        'you likely top up energy through people and outward activity. Long stretches of isolation as "rest" can leave you flatter, not fuller.',
      );
    }
  }
  if (jp?.pct >= 55) {
    parts.push(
      'loose ends (unfinished tasks, unclear plans) probably bother you more than they would bother other people. They quietly drain you in the background even when you are not actively thinking about them.',
    );
  } else if (jp?.pct <= 45) {
    parts.push(
      'rigid schedules can feel like extra pressure. Recovery works better when it has room to breathe, not a packed timetable.',
    );
  }
  if (tf && tf.pct >= 45 && tf.pct <= 55) {
    parts.push(
      'under stress you tend to feel it in both mind and emotions, which can make the same load feel heavier than a purely "solve the problem" approach.',
    );
  } else if (tf?.pct <= 45) {
    parts.push('when load is high, the emotional climate around you lands harder than a spreadsheet would suggest.');
  }

  if (!parts.length) {
    return name
      ? `Read this with your ${name} pattern in mind. Recovery should fit how you actually restore, not a one-size list.`
      : '';
  }
  const lead = name ? `This is referencing your ${name} profile. ` : '';
  return stripEmDashes(`${lead}The point is: ${parts.join(' ')}`);
}

function adviceForLevel(cls) {
  if (cls === 'healthy') {
    return {
      intro: 'Two simple ways to keep this range steady:',
      items: [
        'Protect the rest you already have: sleep, a real break, and a clear stop time.',
        'Keep one honest no this week so extra load does not creep back in.',
      ],
    };
  }
  if (cls === 'mild') {
    return {
      intro: 'Two concrete moves for this week:',
      items: [
        'Make one demand smaller: say no, postpone, or shorten something that is not essential.',
        'Put rest on the calendar instead of waiting for a gap to appear.',
      ],
    };
  }
  if (cls === 'severe') {
    return {
      intro: 'Two urgent moves for this week:',
      items: [
        'Cut non-essential load first: delay, delegate, or drop what you actually can.',
        'Ask one person for practical help, and treat rest as a planned block, not leftover time.',
      ],
    };
  }
  return {
    intro: 'Two concrete moves for this week:',
    items: [
      'Reduce what is on your plate where you actually can: say no, delegate, or postpone non-essential things.',
      'Deliberately schedule rest rather than waiting for it to happen. If you do not plan it, something else will eat that time.',
    ],
  };
}

/**
 * Structured burnout explanation for the results UI.
 */
export function buildBurnoutReport(burnout, personality = null) {
  const pct = Math.round(Number(burnout?.pct) || 0);
  const cls = String(burnout?.cls || 'moderate').toLowerCase();
  const level = burnout?.level || 'Moderate Burnout';
  const tops = topLoadDimensions(burnout?.dimensions, 2);
  const drivers = tops.map(driverItem);
  const advice = adviceForLevel(cls);
  const profile = profileNote(personality);

  const driverTitle =
    drivers.length === 2
      ? `"${drivers[0].title.toLowerCase()}" and "${drivers[1].title.toLowerCase()}" are pulling the score up`
      : drivers.length === 1
        ? `"${drivers[0].title.toLowerCase()}" is pulling the score up`
        : 'What the score is picking up';

  return {
    heading: `The score (${pct}%, "${level}")`,
    meaning: stripEmDashes(scoreMeaning(cls, pct, level)),
    driverTitle: stripEmDashes(driverTitle),
    driverIntro:
      drivers.length > 1
        ? 'These are the two areas hitting you hardest. In plain terms:'
        : drivers.length === 1
          ? 'In plain terms:'
          : 'The score reflects strain across the whole check-in, not a performance target.',
    drivers,
    profileTitle: typeNameOf(personality) ? `"${typeNameOf(personality)}" profile note` : 'Profile note',
    profileBody: profile,
    adviceTitle: 'The advice',
    adviceIntro: advice.intro,
    adviceItems: advice.items,
  };
}

export function flattenBurnoutReport(report) {
  if (!report) return '';
  const driverLines = (report.drivers ?? [])
    .map((d, i) => `${i + 1}. ${d.title}: ${d.body}`)
    .join(' ');
  const adviceLines = (report.adviceItems ?? [])
    .map((item, i) => `${i + 1}. ${item}`)
    .join(' ');
  return stripEmDashes(
    [
      report.heading,
      report.meaning,
      report.driverTitle,
      report.driverIntro,
      driverLines,
      report.profileBody,
      report.adviceTitle,
      report.adviceIntro,
      adviceLines,
    ]
      .filter(Boolean)
      .join(' '),
  );
}

export function buildBurnoutNarrative(burnout, personality = null) {
  return flattenBurnoutReport(buildBurnoutReport(burnout, personality));
}

export function resolveBurnoutSummary(burnout, personality = null) {
  return flattenBurnoutReport(buildBurnoutReport(burnout, personality));
}

export function resolveBurnoutReport(burnout, personality = null) {
  return buildBurnoutReport(burnout, personality);
}

function eiSection(ei) {
  if (!ei) return null;
  if (ei.pct <= 49) {
    const intro = leanPct(false, ei.pct);
    const strength =
      intro >= 65
        ? 'This is a fairly strong lean.'
        : 'Not extreme, but leaning that way.';
    return {
      title: `${intro}% Introversion`,
      body: `You recharge by being alone or in low-key settings, not by being around people. ${strength} So if you've been in back-to-back meetings or social obligations, that's likely draining you faster than it would drain someone more extroverted.`,
    };
  }
  const extra = leanPct(true, ei.pct);
  const strength = extra >= 65 ? 'This is a fairly strong lean.' : 'Not extreme, but leaning that way.';
  return {
    title: `${extra}% Extraversion`,
    body: `You usually refill through people and outward activity. ${strength} Long stretches of quiet isolation as "rest" can leave you flatter, not restored.`,
  };
}

function snSection(sn) {
  if (!sn) return null;
  if (sn.pct <= 49) {
    const n = leanPct(false, sn.pct);
    const strength =
      n >= 70
        ? `This is a stronger trait for you (${n}% is fairly pronounced).`
        : `You lean this way (${n}%).`;
    return {
      title: `${n}% Intuition (pattern-seeking, big-picture focus)`,
      body: `You naturally think in terms of the bigger picture, patterns, and "where is this all heading" rather than just the immediate task in front of you. ${strength} It's useful for strategy and vision, but it can also mean your mind keeps chewing on the broader implications of things instead of settling once a task is technically done.`,
    };
  }
  const s = leanPct(true, sn.pct);
  const strength =
    s >= 70 ? `This is a stronger trait for you (${s}% is fairly pronounced).` : `You lean this way (${s}%).`;
  return {
    title: `${s}% Sensing (concrete, practical focus)`,
    body: `You tend to stay with what is real and in front of you: facts, steps, the next useful action. ${strength} That keeps things grounded, but it can also mean the bigger "why" gets skipped until the load is already high.`,
  };
}

function tfSection(tf) {
  if (!tf) return null;
  if (tf.pct >= 45 && tf.pct <= 55) {
    return {
      title: 'Both head and heart under pressure',
      body: `Under stress, you don't just think it through logically. You also feel it emotionally. Some people can put stress in a "just a problem to solve" box. For you, stress hits the analytical side and the emotional side at once, which can make it feel heavier.`,
    };
  }
  if (tf.pct >= 55) {
    return {
      title: `${tf.pct}% Thinking (clear criteria under pressure)`,
      body: `When things get hard, you look for a problem you can solve and a boundary you can name. Vague encouragement lands less well than a clear next step. That is a strength, and it can also mean feelings get postponed until the tank is already low.`,
    };
  }
  const f = leanPct(false, tf.pct);
  return {
    title: `${f}% Feeling (values and people under pressure)`,
    body: `Stress lands in the emotional climate as much as in the task list. How people are treated, including you, shapes how heavy the day feels. That attunement is a strength, and it can make load feel personal faster.`,
  };
}

function jpSection(jp) {
  if (!jp) return null;
  if (jp.pct >= 55) {
    const strength = jp.pct >= 65 ? 'This lean is fairly clear.' : 'You lean this way.';
    return {
      title: `${jp.pct}% Judging (plans and closure)`,
      body: `You like things decided, settled, and wrapped up rather than left open-ended. ${strength} Ambiguity or loose ends bother you more than they would bother a more "go with the flow" person. Unfinished tasks and vague plans genuinely cost you extra energy, not just annoyance.`,
    };
  }
  const p = leanPct(false, jp.pct);
  return {
    title: `${p}% Perceiving (flexibility and open options)`,
    body: `You do better with room to adapt than with a locked plan. Tight schedules can feel like pressure on top of the actual work. Leave recovery a little loose on purpose.`,
  };
}

function moodboardClose(personality, burnout) {
  const cls = String(burnout?.cls || '').toLowerCase();
  const elevated = cls === 'moderate' || cls === 'severe' || (burnout?.pct ?? 0) >= 45;
  const traits = personality?.traits ?? [];
  const ei = traitPole(traits, 'E');
  const sn = traitPole(traits, 'S');
  const jp = traitPole(traits, 'J');

  const bits = [];
  if (ei && ei.pct <= 45) bits.push('recharges through quiet');
  else if (ei && ei.pct >= 55) bits.push('recharges through people and activity');
  if (jp?.pct >= 55) bits.push('likes closure');
  else if (jp?.pct <= 45) bits.push('needs flexible space');
  if (sn && sn.pct <= 45) bits.push('thinks in big-picture patterns');
  bits.push('feels stress in both mind and emotions');

  const who = bits.length
    ? `Basically: you're someone who ${bits.slice(0, 3).join(', ')}.`
    : 'Basically: this profile is a map of how you restore, not a verdict.';

  if (elevated) {
    return `${who} Right now that combination is running a bit depleted, so this is meant as a calm "here's what's going on" moment, not another push to do more.`;
  }
  return `${who} The tone here is meant to stay gentle: here's what's going on, not a new to-do list.`;
}

/**
 * Moodboard as short trait sections (no em dashes).
 */
export function buildMoodboardSections(personality, burnout = null) {
  const traits = personality?.traits ?? [];
  const sections = [
    eiSection(traitPole(traits, 'E')),
    snSection(traitPole(traits, 'S')),
    tfSection(traitPole(traits, 'T')),
    jpSection(traitPole(traits, 'J')),
  ]
    .filter(Boolean)
    .map((s) => ({
      title: stripEmDashes(s.title),
      body: stripEmDashes(s.body),
    }));

  sections.push({
    title: 'Why the tone is calm',
    body: stripEmDashes(moodboardClose(personality, burnout)),
  });

  return sections;
}

export function buildMoodboardCaption(personality, burnout = null) {
  return buildMoodboardSections(personality, burnout)
    .map((s) => `${s.title}. ${s.body}`)
    .join(' ');
}
