/**
 * Work-context datasets for assessment question generation.
 * The LLM agent uses these blocks to rewrite anchor questions without implying
 * the wrong life situation (e.g. employer timelines for a job seeker).
 */

export const WORK_CONTEXT_COACHING = {
  full_time: {
    id: 'full_time',
    label: 'Employed full-time',
    reality:
      'They work a regular full-time job with a manager, team, and organisational expectations.',
    stressors: [
      'meeting load and back-to-back calendars',
      'deadlines and deliverables from their role',
      'manager expectations and performance pressure',
      'work-life boundaries after hours',
      'recognition and visibility in the organisation',
    ],
    prefer: [
      'meetings, deadlines, workload, manager, team, commute, after-hours messages',
      'role expectations and organisational pace',
    ],
    avoid: [
      'job applications, interviews, or unemployment',
      'exam timetables or semester structure (unless clearly secondary)',
    ],
  },
  part_time: {
    id: 'part_time',
    label: 'Employed part-time',
    reality:
      'They work part-time hours — often balancing other commitments alongside limited paid work.',
    stressors: [
      'fitting work into a smaller schedule',
      'income uncertainty relative to full-time peers',
      'handoffs and coverage when not on shift',
      'being visible and valued with fewer hours',
      'boundary-setting between work and other roles',
    ],
    prefer: [
      'shifts, limited hours, scheduling, coverage, part-time workload',
    ],
    avoid: [
      'full-time-only framing like "my entire workweek is packed"',
      'job search or student exam framing as primary',
    ],
  },
  self_employed: {
    id: 'self_employed',
    label: 'Self-employed / freelancer',
    reality:
      'They run their own work — clients, projects, and income are largely self-directed.',
    stressors: [
      'client deadlines and scope creep',
      'irregular income and chasing payments',
      'wearing every hat (sales, delivery, admin)',
      'no clear off switch',
      'feast-or-famine project cycles',
    ],
    prefer: [
      'clients, projects, invoices, pitching, self-set deadlines, business admin',
    ],
    avoid: [
      'manager, performance review, or "timelines I am given" by an employer',
      'team meetings they do not control (unless collaborators)',
    ],
  },
  student: {
    id: 'student',
    label: 'Student',
    reality:
      'Their main structure is study — classes, assignments, exams, and campus or online learning.',
    stressors: [
      'assignment and exam deadlines',
      'competition and comparison with peers',
      'unclear future career path',
      'balancing study with work or family',
      'focus and burnout from constant learning',
    ],
    prefer: [
      'assignments, exams, study sessions, lectures, group projects, academic calendar',
    ],
    avoid: [
      'manager, performance review, full-time job workload as primary',
      'job search pipelines unless they also indicated job seeking',
    ],
  },
  caregiver: {
    id: 'caregiver',
    label: 'Caregiver / homemaker',
    reality:
      'Their labour is often unpaid care for home or family — emotionally demanding and rarely clocked out.',
    stressors: [
      'always-on responsibility for others',
      'lack of recognition for invisible labour',
      'no backup or respite',
      'guilt when taking personal time',
      'fragmented sleep and constant interruptions',
    ],
    prefer: [
      'caring for others, household load, emotional labour, lack of personal time, being needed',
    ],
    avoid: [
      'manager, team meetings, office deadlines, performance reviews',
      'corporate HR language',
    ],
  },
  between_roles: {
    id: 'between_roles',
    label: 'Between roles / job seeking',
    reality:
      'They are not in paid employment right now — job search, transition, or gap is their main work context.',
    stressors: [
      'application volume and silence or rejection',
      'self-imposed or external pressure to "hurry up"',
      'financial uncertainty and identity tied to work',
      'interview prep and emotional whiplash',
      'unstructured days and loss of routine',
      'comparison with peers who seem to be moving faster',
    ],
    prefer: [
      'job search pace, applications, interviews, rejection, financial pressure',
      'self-set goals, unstructured time, identity during transition',
      'pressure from family or society about finding work',
    ],
    avoid: [
      'timelines I am given (by an employer)',
      'my manager, boss, supervisor, or performance review',
      'team deadlines assigned at work',
      'meeting load at the office',
      'commute to my job',
      'any wording that assumes they currently have a paid employer',
    ],
  },
  retired: {
    id: 'retired',
    label: 'Retired',
    reality:
      'They are retired from primary paid work — structure, purpose, and health may be the focus.',
    stressors: [
      'loss of routine and identity after work',
      'health or energy limits',
      'social isolation or too many obligations',
      'caring for family or community roles',
      'purpose and meaning in daily life',
    ],
    prefer: [
      'routine, purpose, energy, health, volunteering, family roles, life after work',
    ],
    avoid: [
      'manager, office deadlines, performance reviews, full-time workload',
      'job search or student exam framing',
    ],
  },
};

const CONTEXT_BY_ID = WORK_CONTEXT_COACHING;

/** Burnout dimension labels used in anchor metadata. */
export const BURNOUT_DIMENSIONS = [
  'exhaustion',
  'cynicism',
  'efficacy',
  'autonomy',
  'recognition',
  'community',
];

/**
 * Per-context, per-dimension rewrite examples.
 * Teaches the agent what each dimension means IN this life situation.
 */
export const BURNOUT_DIMENSION_HINTS = {
  between_roles: {
    exhaustion: {
      theme: 'Depletion from job search effort, not workplace overload',
      example: 'I feel emotionally drained after sending applications or preparing for interviews.',
    },
    cynicism: {
      theme: 'Doubt about the process, hiring market, or self-worth — not cynicism about a boss',
      example: 'I catch myself feeling hopeless about whether my job search will ever move forward.',
    },
    efficacy: {
      theme: 'Sense of progress and capability in the search — not performance at a job',
      example: 'I rarely feel that my applications or interviews reflect what I can actually offer.',
    },
    autonomy: {
      theme: 'Control over search pace and priorities — NOT timelines given by an employer',
      example: 'I feel pressure to move faster in my job search than my energy and priorities allow.',
    },
    recognition: {
      theme: 'Feeling seen and valued during unemployment — not praise from a manager',
      example: 'I rarely feel that my effort in this job search is acknowledged or appreciated.',
    },
    community: {
      theme: 'Connection and support while between roles — not team belonging at work',
      example: 'I feel isolated in my job search and miss having people who understand what I am going through.',
    },
  },
  student: {
    exhaustion: {
      theme: 'Study fatigue, not workplace burnout',
      example: 'I feel mentally exhausted after long study sessions or back-to-back classes.',
    },
    cynicism: {
      theme: 'Cynicism about academics, future prospects, or learning — not about a manager',
      example: 'I often question whether the effort I put into my studies will actually pay off.',
    },
    efficacy: {
      theme: 'Confidence in academic ability and progress',
      example: 'I struggle to feel that I am keeping up or doing well enough in my coursework.',
    },
    autonomy: {
      theme: 'Control over study schedule and priorities — not employer deadlines',
      example: 'I feel my schedule is driven by deadlines I did not choose, not by how I learn best.',
    },
    recognition: {
      theme: 'Feeling valued for academic effort — not workplace recognition',
      example: 'I rarely feel that my hard work in school is noticed or appreciated.',
    },
    community: {
      theme: 'Belonging among peers, classmates, or campus life',
      example: 'I feel disconnected from classmates or peers even when I am around them.',
    },
  },
  caregiver: {
    exhaustion: {
      theme: 'Fatigue from caregiving and household load',
      example: 'I feel physically and emotionally drained by the end of most days caring for others.',
    },
    cynicism: {
      theme: 'Resentment or numbness about caregiving role — not workplace cynicism',
      example: 'I sometimes feel bitter about how much of myself caregiving takes.',
    },
    efficacy: {
      theme: 'Feeling capable and effective in caregiving responsibilities',
      example: 'I often feel I am not doing enough for the people who depend on me.',
    },
    autonomy: {
      theme: 'Personal time and choice — not control at an office job',
      example: 'I rarely get to choose how I spend my time without someone else needing me.',
    },
    recognition: {
      theme: 'Invisible labour being acknowledged',
      example: 'The work I do at home rarely feels seen or appreciated by others.',
    },
    community: {
      theme: 'Support network outside the home',
      example: 'I feel cut off from friends or community because caregiving takes all my energy.',
    },
  },
  self_employed: {
    exhaustion: {
      theme: 'Burnout from running the business solo',
      example: 'I feel worn down by juggling clients, admin, and delivery without enough rest.',
    },
    cynicism: {
      theme: 'Doubt about clients, market, or the work itself',
      example: 'I sometimes lose enthusiasm for client work that used to energise me.',
    },
    efficacy: {
      theme: 'Confidence in delivering value as a freelancer',
      example: 'I often doubt whether my work is as good or as valued as it should be.',
    },
    autonomy: {
      theme: 'Self-direction vs client demands — not manager control',
      example: 'I feel client expectations override the pace and boundaries I set for myself.',
    },
    recognition: {
      theme: 'Clients or market acknowledging their work',
      example: 'I rarely feel my freelance work gets the respect or fair compensation it deserves.',
    },
    community: {
      theme: 'Professional peers and isolation of solo work',
      example: 'Working alone, I miss having colleagues who share the load with me.',
    },
  },
  part_time: {
    exhaustion: {
      theme: 'Fatigue from balancing limited work hours with other life roles',
      example: 'I feel stretched thin trying to fit part-time work into everything else I manage.',
    },
    cynicism: {
      theme: 'Disengagement from part-time role or employer',
      example: 'I find it hard to stay motivated about work when my hours feel undervalued.',
    },
    efficacy: {
      theme: 'Making an impact with limited time on the job',
      example: 'I worry my part-time contribution does not matter as much as full-time colleagues.',
    },
    autonomy: {
      theme: 'Schedule control with part-time constraints',
      example: 'I feel my limited hours leave me little say in how or when work gets done.',
    },
    recognition: {
      theme: 'Being valued despite fewer hours',
      example: 'I rarely feel fully included or recognised for what I contribute part-time.',
    },
    community: {
      theme: 'Belonging on a team with reduced presence',
      example: 'I feel like an outsider on my team because I am not there as much as others.',
    },
  },
  full_time: {
    exhaustion: {
      theme: 'Work-related depletion',
      example: 'I feel drained by the end of most workdays.',
    },
    cynicism: {
      theme: 'Detachment from work or organisation',
      example: 'I have become more cynical about my job than I used to be.',
    },
    efficacy: {
      theme: 'Accomplishment and competence at work',
      example: 'I often feel my work does not make a meaningful difference.',
    },
    autonomy: {
      theme: 'Control over how and when work gets done',
      example: 'I feel my manager or organisation sets expectations that ignore how I work best.',
    },
    recognition: {
      theme: 'Acknowledgement from manager or organisation',
      example: 'I rarely feel my contributions at work are noticed or appreciated.',
    },
    community: {
      theme: 'Connection with colleagues and team',
      example: 'I feel disconnected from the people I work with most days.',
    },
  },
  retired: {
    exhaustion: {
      theme: 'Low energy in daily life after work — not job fatigue',
      example: 'I feel tired more often than I would like, even without a job to go to.',
    },
    cynicism: {
      theme: 'Pessimism about purpose or daily life — not workplace cynicism',
      example: 'I sometimes feel flat or uninterested in things that used to matter to me.',
    },
    efficacy: {
      theme: 'Feeling useful and capable in this life stage',
      example: 'I often wonder whether I still have meaningful contributions to make.',
    },
    autonomy: {
      theme: 'Choice over how days are structured in retirement',
      example: 'I feel my days are shaped by obligations rather than what I actually want to do.',
    },
    recognition: {
      theme: 'Feeling valued beyond former career identity',
      example: 'I rarely feel that what I do now is as respected as when I was working.',
    },
    community: {
      theme: 'Social connection after leaving the workforce',
      example: 'I feel more isolated now than when I had regular contact through work.',
    },
  },
};

/** Phrases that strongly imply paid employment — invalid for job seekers. */
const EMPLOYER_LANGUAGE_PATTERNS = [
  /\btimelines?\s+(i['']?m|i am)\s+given\b/i,
  /\bmy\s+(manager|boss|supervisor|employer)\b/i,
  /\bperformance\s+review\b/i,
  /\b(at|in)\s+the\s+office\b/i,
  /\bteam\s+deadline\b/i,
  /\bassigned\s+to\s+me\s+at\s+work\b/i,
  /\bmy\s+workplace\b/i,
];

const OFFICE_ONLY_CONTEXTS = new Set(['between_roles', 'student', 'caregiver', 'retired']);

export function workContextMeta(workContextId) {
  const id = String(workContextId ?? '').trim();
  return CONTEXT_BY_ID[id] ?? null;
}

export function workContextQuestionCoaching(workContextId) {
  const meta = workContextMeta(workContextId);
  if (!meta) return '';

  const lines = [
    `Work situation: ${meta.label}`,
    `Reality: ${meta.reality}`,
    'Realistic stressors for THIS person:',
    ...meta.stressors.map((item) => `- ${item}`),
    'When rewriting, USE language like:',
    ...meta.prefer.map((item) => `- ${item}`),
    'When rewriting, NEVER imply:',
    ...meta.avoid.map((item) => `- ${item}`),
    'Critical: the rewritten question must sound natural ONLY for this work situation — not a generic office worker.',
  ];

  return lines.join('\n');
}

/**
 * Dimension-specific coaching for burnout question rewrites.
 * Returns a focused block when we have hints for this context + dimension.
 */
export function burnoutDimensionCoaching(workContextId, dimension) {
  const contextId = String(workContextId ?? '').trim();
  const dim = String(dimension ?? '').toLowerCase();
  if (!contextId || !dim) return '';

  const hints = BURNOUT_DIMENSION_HINTS[contextId]?.[dim];
  if (!hints) return '';

  return [
    `Burnout dimension "${dim}" in this context means:`,
    `- Theme: ${hints.theme}`,
    `- Good rewrite example (match scale/style of seed): "${hints.example}"`,
    '- Adapt the example to the seed scale (agreement vs frequency) — do not copy verbatim if scale differs',
  ].join('\n');
}

/**
 * Lightweight guardrail when LLM output implies the wrong life context.
 * Returns an error message or null if OK.
 */
export function workContextLanguageViolation(text, workContextId) {
  const copy = String(text ?? '').trim();
  if (!copy || !OFFICE_ONLY_CONTEXTS.has(workContextId)) return null;

  for (const pattern of EMPLOYER_LANGUAGE_PATTERNS) {
    if (pattern.test(copy)) {
      return `question implies paid employment language inappropriate for ${workContextId}`;
    }
  }

  if (workContextId === 'between_roles' && /\bduring this job search\b/i.test(copy)) {
    // "timelines during this job search that don't account for my pace" is OK;
    // already covered by employer patterns above.
  }

  return null;
}
