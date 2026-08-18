/**
 * Multi-day recovery plans keyed to burnout severity.
 * Full plan is generated in code; guests only receive a teaser.
 */

import { normalizeRecommendationsList } from './recommendations.js';

export const ROADMAP_HORIZON = {
  healthy: { days: 3, label: '3-day maintenance plan' },
  mild: { days: 7, label: '7-day reset plan' },
  moderate: { days: 14, label: '14-day recovery plan' },
  severe: { days: 21, label: '21-day recovery plan' },
};

const GUEST_PHASES = 1;

function clsOf(burnout) {
  const cls = String(burnout?.cls ?? '').toLowerCase();
  if (ROADMAP_HORIZON[cls]) return cls;
  const level = String(burnout?.level ?? '').toLowerCase();
  if (level.includes('severe')) return 'severe';
  if (level.includes('mild')) return 'mild';
  if (level.includes('healthy')) return 'healthy';
  return 'moderate';
}

function protocolAt(profile, index) {
  const list = profile?.actionable_protocol ?? [];
  return list[index] ?? list[0] ?? null;
}

function recoveryFlavor(prefs) {
  const social = prefs?.social || '';
  const activity = prefs?.activity || '';
  const setting = prefs?.setting || '';
  const place =
    setting === 'outdoors'
      ? 'outside, even if it is only the nearest quiet corner'
      : setting === 'city_spaces'
        ? 'in a low-demand public space you already like'
        : setting === 'mixed'
          ? 'somewhere you can actually drop the day'
          : 'at home, with the door closed if you can';
  const move =
    activity === 'movement'
      ? `Take a 12-minute walk ${place}. No podcast, no inbox.`
      : activity === 'creative'
        ? `Spend 15 minutes on one creative thing ${place}. Stop when the timer ends.`
        : activity === 'social_hangout'
          ? 'Keep social time to one person and one hour. Leave on time.'
          : `Sit ${place} for 15 minutes with no productivity goal.`;
  const people =
    social === 'lively_social'
      ? 'If you need people, cap it at one gathering with a hard end time.'
      : social === 'small_group'
        ? 'Prefer one familiar person over a group.'
        : 'Default to solo or one trusted person. Crowds are optional, not recovery.';
  return { place, move, people };
}

function step(icon, when, title, tip, extra = {}) {
  return { icon, when, title, tip, ...extra };
}

function phase(id, dayStart, dayEnd, label, title, focus, steps) {
  return { id, dayStart, dayEnd, label, title, focus, steps };
}

function dayLabel(start, end) {
  if (start === end) return `Day ${start}`;
  return `Days ${start}–${end}`;
}

function buildHealthy(flavor, protocol) {
  return [
    phase(
      'stabilize',
      1,
      1,
      'Day 1',
      'Protect what is already working',
      'Keep the floor steady. Do not add load "because you feel fine".',
      [
        step('🛡', 'Today', 'Name the stop time', 'Write tonight\'s stop time before noon. When it hits, close the last tab and leave the unfinished item for tomorrow.'),
        step('🌿', 'Tonight', 'Keep one recovery slot', flavor.move),
      ],
    ),
    phase(
      'boundary',
      2,
      3,
      'Days 2–3',
      'One honest no',
      'Mild strain creeps back through extra yeses. Cut one before it lands.',
      [
        step(
          '✋',
          dayLabel(2, 3),
          'Delay the next yes',
          protocol?.protocol_rule ||
            'Before accepting any new request, wait two hours. Reply: "I will confirm after I check my plate."',
          protocol ? { trigger: protocol.trigger, trap: protocol.personality_trap } : {},
        ),
        step('💬', dayLabel(2, 3), 'One real check-in', flavor.people),
      ],
    ),
  ];
}

function buildMild(flavor, protocol, protocol2) {
  return [
    phase(
      'cut',
      1,
      1,
      'Day 1',
      'Cut one demand today',
      'Load is rising. Shrink something real in the next 24 hours.',
      [
        step('🛑', 'Today', 'Drop or defer one thing', 'Pick one non-essential task. Tell the relevant person what is moving, then stop renegotiating with yourself.'),
        step('😴', 'Tonight', 'Screens off buffer', 'Set a screens-off time 30 minutes before bed. Put the phone outside the bedroom if you can.'),
      ],
    ),
    phase(
      'hygiene',
      2,
      3,
      'Days 2–3',
      'Quiet the inputs',
      'Recovery fails when the day never actually ends.',
      [
        step('🔕', dayLabel(2, 3), 'Two message windows', 'Mute non-urgent notifications. Check messages twice a day, 15 minutes each. No third window.'),
        step('☀️', 'Mornings', 'Inbox last', 'Do not open email or chat until you have had 15 quiet minutes. The buffer is the first appointment.'),
      ],
    ),
    phase(
      'protocol',
      4,
      7,
      'Days 4–7',
      'Install one constraint',
      'A trait trap will try to refill the plate. Block it with a written rule.',
      [
        step(
          '⚙️',
          dayLabel(4, 7),
          'Run the protocol',
          protocol?.protocol_rule || 'Write a "done enough" line before you start. Stop when you hit it.',
          protocol ? { trigger: protocol.trigger, trap: protocol.personality_trap } : {},
        ),
        step(
          '📋',
          'End of week',
          'Three-line review',
          protocol2?.protocol_rule
            ? `${protocol2.protocol_rule} Then write three lines: what you dropped, what you kept, what repeats next week.`
            : 'Write three lines: what you dropped, what still drained you, what you will refuse next week.',
        ),
      ],
    ),
  ];
}

function buildModerate(flavor, protocol, protocol2) {
  return [
    phase(
      'stabilize',
      1,
      1,
      'Day 1',
      'Stabilize the next 24 hours',
      'You are in sustained strain. Today is for stopping the bleed, not catching up.',
      [
        step('📅', 'Today', 'Block 30 minutes of rest', 'Put a 30-minute rest block on today with no productivity goal. Treat it like a meeting you cannot skip.'),
        step('🎯', 'Today', 'Three priorities only', 'Write three priorities for this week. Everything else waits. If a fourth item appears, it replaces one of the three or it waits.'),
      ],
    ),
    phase(
      'shrink',
      2,
      4,
      'Days 2–4',
      'Shrink the plate',
      'The trait that over-functions will try to refill the list. Hold the constraint.',
      [
        step(
          '⚙️',
          dayLabel(2, 4),
          'Enforce the trap rule',
          protocol?.protocol_rule || 'Use a 2-hour delay before accepting any new request.',
          protocol ? { trigger: protocol.trigger, trap: protocol.personality_trap } : {},
        ),
        step('🔕', dayLabel(2, 4), 'Cut the noise', 'Mute non-urgent notifications for 48 hours. Two short check windows only.'),
        step('🌙', 'Evenings', 'Close the loop on paper', flavor.move),
      ],
    ),
    phase(
      'support',
      5,
      8,
      'Days 5–8',
      'Get one person in the loop',
      'Carrying this alone is part of the strain. Name it to someone specific.',
      [
        step('💬', dayLabel(5, 8), 'Ask for one concrete help', 'Tell one trusted person you are depleted. Name one thing they can take, cover, or check in on before Friday.'),
        step(
          '✋',
          dayLabel(5, 8),
          'Second constraint',
          protocol2?.protocol_rule || 'Send one ownership message: you can own A or B by Friday, not both.',
          protocol2 ? { trigger: protocol2.trigger, trap: protocol2.personality_trap } : {},
        ),
      ],
    ),
    phase(
      'sustain',
      9,
      14,
      'Days 9–14',
      'Hold the new floor',
      'The second week is where old habits return. Keep the rules even when you feel slightly better.',
      [
        step('🧱', dayLabel(9, 14), 'Keep the three-item cap', 'Each morning, rewrite the three-item list. If you finish early, stop. Do not pull from the backlog for sport.'),
        step('🔁', 'Day 14', 'Re-check, do not restart', 'Compare energy to Day 1 in one sentence. Keep the constraints that worked. Do not add a new self-improvement project.'),
        step('🌿', 'This week', 'Recovery in your shape', flavor.people),
      ],
    ),
  ];
}

function buildSevere(flavor, protocol, protocol2) {
  return [
    phase(
      'safety',
      1,
      1,
      'Day 1',
      'Get support in the room',
      'This range is a strong signal to reduce load and get help, not to push harder.',
      [
        step('🆘', 'Today', 'Tell one real person', 'Talk today to a manager, coach, trusted person, or professional about your load. Ask for one concrete change this week.'),
        step('🏠', 'Today', 'Minimum viable day', 'Define the smallest version of a livable day (sleep, food, one essential task). Aim only for that until tomorrow.'),
      ],
    ),
    phase(
      'stop',
      2,
      4,
      'Days 2–4',
      'Stop adding',
      'Nothing new lands on the plate until something comes off.',
      [
        step('🛑', dayLabel(2, 4), 'One hard no', 'Say no to one new request before taking on anything else. Script: "I cannot take that on right now."'),
        step(
          '⚙️',
          dayLabel(2, 4),
          'Install the protocol',
          protocol?.protocol_rule || 'Write tomorrow\'s top concern on one line, then close the notebook.',
          protocol ? { trigger: protocol.trigger, trap: protocol.personality_trap } : {},
        ),
        step('💤', 'Nights', 'Recovery before extra', 'Choose one recovery action before extra work or scrolling. Sleep, food, or the quiet slot comes first.'),
      ],
    ),
    phase(
      'cover',
      5,
      10,
      'Days 5–10',
      'Build cover, not willpower',
      'Severe strain does not yield to more effort. You need fewer obligations and more backup.',
      [
        step('🤝', dayLabel(5, 10), 'Ask for cover', 'Name one recurring obligation someone else can take for two weeks. Ask once, in writing.'),
        step(
          '📋',
          dayLabel(5, 10),
          'Hold the second rule',
          protocol2?.protocol_rule || 'Log three completed items before opening a new one.',
          protocol2 ? { trigger: protocol2.trigger, trap: protocol2.personality_trap } : {},
        ),
        step('🌿', 'Daily', 'Keep the floor tiny', flavor.move),
      ],
    ),
    phase(
      'rebuild',
      11,
      16,
      'Days 11–16',
      'Rebuild one loop only',
      'Do not redesign your life. Restore one daily loop that actually restores you.',
      [
        step('🔁', dayLabel(11, 16), 'One repeatable hour', 'Pick one hour that is the same every day (morning buffer, walk, or screens-off). Protect it even if the rest of the day is messy.'),
        step('💬', dayLabel(11, 16), 'Follow up on help', 'If Day 1 support stalled, follow up once. If it landed, keep the change. Do not add a second transformation.'),
      ],
    ),
    phase(
      'hold',
      17,
      21,
      'Days 17–21',
      'Hold, then reassess',
      'The last stretch is for keeping the floor, not proving you are back.',
      [
        step('🧱', dayLabel(17, 21), 'No new projects', 'If an idea appears, write it on a later list. This window is for maintenance only.'),
        step('🩺', 'Day 21', 'Decide the next support', 'Write whether you need more professional, workplace, or personal cover. One next step, not ten.'),
        step('🌙', 'This week', 'Recovery in your shape', flavor.people),
      ],
    ),
  ];
}

const BUILDERS = {
  healthy: buildHealthy,
  mild: buildMild,
  moderate: buildModerate,
  severe: buildSevere,
};

function intentFor(cls, horizon) {
  if (cls === 'healthy') {
    return `A ${horizon.days}-day plan to keep strain low. The job is protection, not a overhaul.`;
  }
  if (cls === 'mild') {
    return `A ${horizon.days}-day plan to cut rising load before it becomes chronic. One demand comes off, then one constraint stays on.`;
  }
  if (cls === 'severe') {
    return `A ${horizon.days}-day plan for high strain. Get support in the room, stop adding, then hold a tiny floor. This is not a diagnosis.`;
  }
  return `A ${horizon.days}-day plan for sustained strain. Stabilize first, shrink the plate, then hold the new floor for a second week.`;
}

/**
 * Deterministic full recovery roadmap from burnout + psychometric protocols.
 */
export function buildRecoveryRoadmap({
  burnout,
  personality,
  psychometricProfile,
  recoveryPreferences,
} = {}) {
  const cls = clsOf(burnout);
  const horizon = ROADMAP_HORIZON[cls];
  const profile = psychometricProfile ?? personality?.psychometricProfile ?? null;
  const flavor = recoveryFlavor(recoveryPreferences ?? personality?.recoveryPreferences);
  const p1 = protocolAt(profile, 0);
  const p2 = protocolAt(profile, 1);
  const phases = BUILDERS[cls](flavor, p1, p2);

  return {
    cls,
    horizonDays: horizon.days,
    horizonLabel: horizon.label,
    intent: intentFor(cls, horizon),
    archetype: profile?.diagnostic_summary?.primary_archetype ?? personality?.type?.title ?? '',
    phases,
    locked: false,
    lockedPhaseCount: 0,
    guestPreview: false,
  };
}

export function flattenRoadmapSteps(roadmap) {
  const phases = roadmap?.phases ?? [];
  const steps = [];
  for (const phaseItem of phases) {
    for (const s of phaseItem.steps ?? []) {
      steps.push({
        ...s,
        when: s.when || phaseItem.label,
        phaseId: phaseItem.id,
        phaseLabel: phaseItem.label,
      });
    }
  }
  return steps;
}

export function roadmapToRecommendations(roadmap, limit = 4) {
  return flattenRoadmapSteps(roadmap)
    .slice(0, limit)
    .map((s) => ({
      icon: s.icon || '💡',
      when: s.when || 'Today',
      title: s.title || 'Recovery step',
      tip: s.tip || '',
    }));
}

/** Guest view: first phase in full, later phases as locked shells. */
export function teaseRecoveryRoadmap(roadmap) {
  if (!roadmap?.phases?.length) return roadmap;
  const visible = roadmap.phases.slice(0, GUEST_PHASES);
  const locked = roadmap.phases.slice(GUEST_PHASES).map((p) => ({
    id: p.id,
    dayStart: p.dayStart,
    dayEnd: p.dayEnd,
    label: p.label,
    title: p.title,
    focus: p.focus,
    steps: [],
    locked: true,
  }));

  return {
    ...roadmap,
    phases: [...visible, ...locked],
    locked: true,
    lockedPhaseCount: locked.length,
    guestPreview: true,
    unlockLabel: `Sign in to unlock the rest of your ${roadmap.horizonLabel}`,
  };
}

export function isRecoveryRoadmap(value) {
  return Boolean(value && typeof value === 'object' && Array.isArray(value.phases) && value.horizonDays);
}

function sanitizeStep(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const title = String(raw.title ?? '').trim();
  const tip = String(raw.tip ?? raw.body ?? '').trim();
  if (!title && !tip) return null;
  return {
    icon: String(raw.icon ?? '💡').slice(0, 8) || '💡',
    when: String(raw.when ?? '').trim(),
    title: title || 'Recovery step',
    tip,
    trigger: raw.trigger ? String(raw.trigger).trim() : undefined,
    trap: raw.trap ? String(raw.trap).trim() : undefined,
  };
}

function sanitizePhase(raw, index) {
  if (!raw || typeof raw !== 'object') return null;
  const steps = Array.isArray(raw.steps) ? raw.steps.map(sanitizeStep).filter(Boolean) : [];
  const locked = Boolean(raw.locked);
  if (!locked && !steps.length && !raw.title) return null;
  const dayStart = Number(raw.dayStart) || index + 1;
  const dayEnd = Number(raw.dayEnd) || dayStart;
  return {
    id: String(raw.id ?? `phase-${index + 1}`),
    dayStart,
    dayEnd,
    label: String(raw.label ?? dayLabel(dayStart, dayEnd)),
    title: String(raw.title ?? 'Recovery phase'),
    focus: String(raw.focus ?? ''),
    steps: locked ? [] : steps,
    locked,
  };
}

export function normalizeRecoveryRoadmap(raw, fallback = null) {
  if (!raw || typeof raw !== 'object') return fallback;
  const phases = Array.isArray(raw.phases)
    ? raw.phases.map(sanitizePhase).filter(Boolean)
    : [];
  if (!phases.length) return fallback;
  const cls = clsOf({ cls: raw.cls, level: raw.cls });
  const horizon = ROADMAP_HORIZON[raw.cls] ?? ROADMAP_HORIZON[cls] ?? ROADMAP_HORIZON.moderate;
  return {
    cls: raw.cls || cls,
    horizonDays: Number(raw.horizonDays) || horizon.days,
    horizonLabel: String(raw.horizonLabel || horizon.label),
    intent: String(raw.intent ?? ''),
    archetype: String(raw.archetype ?? ''),
    phases,
    locked: Boolean(raw.locked),
    lockedPhaseCount: Number(raw.lockedPhaseCount) || phases.filter((p) => p.locked).length,
    guestPreview: Boolean(raw.guestPreview),
    unlockLabel: raw.unlockLabel ? String(raw.unlockLabel) : undefined,
  };
}

/** Persist both legacy cards and the full roadmap in the sessions JSONB column. */
export function packRecommendationsPayload(recommendations, recoveryRoadmap) {
  const items = normalizeRecommendationsList(
    recommendations ?? roadmapToRecommendations(recoveryRoadmap),
    [],
  );
  return {
    items,
    recoveryRoadmap: isRecoveryRoadmap(recoveryRoadmap)
      ? recoveryRoadmap
      : normalizeRecoveryRoadmap(recoveryRoadmap),
  };
}

export function unpackRecommendationsPayload(stored) {
  if (Array.isArray(stored)) {
    return {
      recommendations: normalizeRecommendationsList(stored, []),
      recoveryRoadmap: null,
    };
  }
  if (stored && typeof stored === 'object') {
    const roadmap = normalizeRecoveryRoadmap(stored.recoveryRoadmap ?? stored.roadmap ?? null);
    const items = stored.items ?? stored.recommendations ?? stored;
    return {
      recommendations: normalizeRecommendationsList(items, roadmap ? roadmapToRecommendations(roadmap) : []),
      recoveryRoadmap: roadmap,
    };
  }
  return { recommendations: [], recoveryRoadmap: null };
}

/** Merge LLM-written titles/tips onto a locked skeleton (same phase ids and step counts). */
export function mergeRoadmapCopy(skeleton, parsed) {
  const incoming = normalizeRecoveryRoadmap(parsed);
  if (!incoming) return skeleton;
  const byId = new Map(incoming.phases.map((p) => [p.id, p]));
  return {
    ...skeleton,
    intent: incoming.intent || skeleton.intent,
    phases: skeleton.phases.map((phaseItem) => {
      const match = byId.get(phaseItem.id);
      if (!match?.steps?.length) return phaseItem;
      return {
        ...phaseItem,
        title: match.title || phaseItem.title,
        focus: match.focus || phaseItem.focus,
        steps: phaseItem.steps.map((s, i) => {
          const next = match.steps[i];
          if (!next) return s;
          return {
            ...s,
            icon: next.icon || s.icon,
            title: next.title || s.title,
            tip: next.tip || s.tip,
          };
        }),
      };
    }),
  };
}
