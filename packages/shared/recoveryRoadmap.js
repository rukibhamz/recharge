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
      ? `Take a 12-minute walk ${place}. No podcast, no inbox. If you catch yourself planning the afternoon, name it once and keep walking.`
      : activity === 'creative'
        ? `Spend 15 minutes on one creative thing ${place}. Set a timer. When it ends, stop even if the piece is unfinished.`
        : activity === 'social_hangout'
          ? 'Keep social time to one person and one hour. Tell them the end time before you start. Leave on time.'
          : `Sit ${place} for 15 minutes with no productivity goal. Phone in another room. If restlessness shows up, stay anyway.`;
  const people =
    social === 'lively_social'
      ? 'If you need people, cap it at one gathering with a hard end time. Put the leaving time in your calendar before you accept.'
      : social === 'small_group'
        ? 'Prefer one familiar person over a group. Suggest a walk or a sitting that already has an end.'
        : 'Default to solo or one trusted person. Crowds are optional, not recovery. If invited, delay the yes until tomorrow.';
  const morningBuffer =
    activity === 'movement'
      ? `Before any inbox, walk 10 minutes ${place}. The walk is the first appointment, not a reward for finishing.`
      : activity === 'creative'
        ? 'Before any inbox, spend 10 minutes on one small making task. No output target.'
        : `Before any inbox, sit ${place} for 10 quiet minutes. Do not use the time to plan the day.`;
  return { place, move, people, morningBuffer };
}

function step(icon, when, title, fields = {}) {
  const out = {
    icon,
    when,
    title,
    tip: fields.tip || '',
  };
  if (fields.how) out.how = fields.how;
  if (fields.why) out.why = fields.why;
  if (fields.script) out.script = fields.script;
  if (fields.check) out.check = fields.check;
  if (fields.protocol) {
    if (fields.protocol.trigger) out.trigger = fields.protocol.trigger;
    if (fields.protocol.personality_trap) out.trap = fields.protocol.personality_trap;
  }
  return out;
}

function phase(id, dayStart, dayEnd, label, title, focus, steps, outcome = '') {
  return { id, dayStart, dayEnd, label, title, focus, outcome, steps };
}

function dayLabel(start, end) {
  if (start === end) return `Day ${start}`;
  return `Days ${start}–${end}`;
}

function dayOnlyLabel(day) {
  return `Day ${day}`;
}

/** Parse explicit day numbers referenced in a step's when field. Empty = recurring within the phase. */
function explicitDaysInWhen(when, phaseStart, phaseEnd) {
  const text = String(when ?? '');
  const days = new Set();

  for (const match of text.matchAll(/Days?\s+(\d+)\s*[–-]\s*(\d+)/gi)) {
    const a = Number(match[1]);
    const b = Number(match[2]);
    for (let d = Math.min(a, b); d <= Math.max(a, b); d += 1) {
      if (d >= phaseStart && d <= phaseEnd) days.add(d);
    }
  }
  for (const match of text.matchAll(/(?:By\s+)?Day\s+(\d+)/gi)) {
    const d = Number(match[1]);
    if (d >= phaseStart && d <= phaseEnd) days.add(d);
  }

  return days;
}

function isRecurringWhen(when) {
  const text = String(when ?? '').toLowerCase();
  if (!text) return true;
  if (/^day\s+\d+(\s*[–-]\s*\d+)?$/i.test(text.trim())) return false;
  if (/^days\s+\d+\s*[–-]\s*\d+$/i.test(text.trim())) return false;
  if (/^by day\s+\d+$/i.test(text.trim())) return false;
  return true;
}

function stepAppliesToDay(step, day, phaseStart, phaseEnd) {
  const explicit = explicitDaysInWhen(step.when, phaseStart, phaseEnd);
  if (explicit.size) return explicit.has(day);
  if (!isRecurringWhen(step.when)) {
    return day === phaseStart;
  }
  return true;
}

function adaptStepForDay(step, day, phaseStart, phaseEnd) {
  const span = phaseEnd - phaseStart + 1;
  const adapted = { ...step };
  const when = String(step.when ?? '');

  if (span === 1) {
    adapted.when = when || dayOnlyLabel(day);
    return adapted;
  }

  if (/both days|each morning|daily|mornings|evenings|nights|when asked|this morning|today|tonight|before bed|afternoon|meals|each day/i.test(when)) {
    adapted.when = when.replace(/both days/gi, 'Today').replace(/each morning/gi, 'Morning').replace(/each day/gi, 'Today');
  } else if (/^day\s+\d+/i.test(when.trim())) {
    adapted.when = dayOnlyLabel(day);
  } else {
    adapted.when = when || dayOnlyLabel(day);
  }

  if (adapted.check) {
    adapted.check = String(adapted.check)
      .replace(/both days/gi, 'today')
      .replace(/both nights/gi, 'tonight')
      .replace(/at least two of these three days/gi, 'today')
      .replace(/at least four of these six days/gi, 'today')
      .replace(/at least three of these four days/gi, 'today')
      .replace(/on at least two of these three days/gi, 'today')
      .replace(/in this window/gi, 'today');
  }

  if (day > phaseStart && /hold yesterday|same as day 1|repeat|continue|keep running|keep the/i.test(`${step.title} ${step.tip}`)) {
    adapted.why = adapted.why ? `${adapted.why} Day ${day} is about repeating, not reinventing.` : adapted.why;
  }

  return adapted;
}

function dailyTitleForPhase(phase, day, phaseStart, phaseEnd) {
  const span = phaseEnd - phaseStart + 1;
  if (span === 1) return phase.title;
  const n = day - phaseStart + 1;
  if (n === 1) return phase.title;
  if (day === phaseEnd) return `${phase.title} · finish`;
  return `${phase.title} · day ${n} of ${span}`;
}

function dailyFocusForPhase(phase, day, phaseStart, phaseEnd) {
  const span = phaseEnd - phaseStart + 1;
  if (span === 1 || day === phaseStart) return phase.focus;
  if (day === phaseEnd) return `Last day of this stretch. ${phase.focus}`;
  return `Same rules as yesterday. ${phase.focus}`;
}

/** Split grouped day ranges into one checklist phase per calendar day. */
export function expandToDailyPhases(phases, totalDays) {
  const buckets = Array.from({ length: totalDays }, () => ({
    title: '',
    focus: '',
    outcome: '',
    steps: [],
    sourceId: '',
  }));

  for (const phaseItem of phases ?? []) {
    const start = Number(phaseItem.dayStart) || 1;
    const end = Number(phaseItem.dayEnd) || start;

    for (let day = start; day <= end; day += 1) {
      const idx = day - 1;
      if (!buckets[idx]) continue;

      buckets[idx].sourceId = buckets[idx].sourceId || phaseItem.id;
      buckets[idx].title = buckets[idx].title || dailyTitleForPhase(phaseItem, day, start, end);
      buckets[idx].focus = buckets[idx].focus || dailyFocusForPhase(phaseItem, day, start, end);
      if (day === end && phaseItem.outcome) {
        buckets[idx].outcome = phaseItem.outcome;
      }

      for (const s of phaseItem.steps ?? []) {
        if (!stepAppliesToDay(s, day, start, end)) continue;
        buckets[idx].steps.push(adaptStepForDay(s, day, start, end));
      }
    }
  }

  return buckets.map((bucket, idx) => {
    const day = idx + 1;
    return phase(
      bucket.sourceId ? `${bucket.sourceId}-d${day}` : `day-${day}`,
      day,
      day,
      dayOnlyLabel(day),
      bucket.title || dayOnlyLabel(day),
      bucket.focus,
      bucket.steps,
      bucket.outcome || (bucket.steps.length ? 'Today’s checklist is complete when every done-when line is true.' : ''),
    );
  });
}

function isDailyPhasePlan(phases, horizonDays) {
  const list = phases ?? [];
  if (!list.length || !horizonDays) return false;
  if (list.length !== horizonDays) return false;
  return list.every((p) => Number(p.dayStart) === Number(p.dayEnd));
}

export function isGroupedRecoveryRoadmap(roadmap) {
  const horizon = Number(roadmap?.horizonDays) || 0;
  const phases = (roadmap?.phases ?? []).filter((p) => p && !p.locked);
  if (!horizon || !phases.length) return false;
  return !isDailyPhasePlan(phases, horizon);
}

function ruleOf(protocol, fallback) {
  return protocol?.protocol_rule || fallback;
}

function protocolTip(protocol, fallback, extra) {
  return `${ruleOf(protocol, fallback)} ${extra}`.replace(/\s+/g, ' ').trim();
}

function trapWhy(protocol, fallback) {
  if (protocol?.personality_trap) {
    return `${protocol.personality_trap} This step exists to interrupt that, not to add another self-improvement task.`;
  }
  return fallback;
}

function leadWhy(ctx, fallback) {
  if (ctx.lead) {
    return `${fallback} Your highest load right now is ${ctx.lead}.`;
  }
  return fallback;
}

function buildHealthy(flavor, p1, p2, ctx) {
  return [
    phase(
      'stabilize',
      1,
      1,
      'Day 1',
      'Protect what is already working',
      'Keep the floor steady. Do not add load because you feel fine. Today is a maintenance drill, not a rest day you have to earn.',
      [
        step('🛡', 'Morning', 'Write tonight’s stop time', {
          tip: 'Before noon, write the exact time work ends tonight. Put it where you will see it: calendar, sticky note, or lock-screen reminder. When it hits, close the last tab and leave the unfinished item.',
          how: '1) Pick a stop time you can actually keep, not an aspirational one. 2) Write the unfinished item on paper so your brain does not keep it open. 3) When the time hits, physically leave the workspace for five minutes.',
          why: leadWhy(ctx, 'Healthy range still slips when the day never actually ends. A written stop time is the cheapest protection you have.'),
          check: 'You can point to a clock time on paper or in a calendar for tonight.',
        }),
        step('📋', 'Midday', 'Cap the open list', {
          tip: 'Count the unfinished items still in play. If there are more than three, park the extras on a later list. You are not dropping them forever. You are refusing to carry them in your head after hours.',
          how: 'Write three live items. Everything else goes under “after tonight.” Do not reopen that list until tomorrow morning.',
          why: 'The over-functioning pattern refills the day through “just one more.” A three-item cap makes that visible.',
          check: 'The live list has three items or fewer.',
        }),
        step('🌿', 'Evening', 'Keep one recovery slot', {
          tip: flavor.move,
          how: 'Set a 15-minute timer. Phone in another room. If you feel guilty, stay until the timer ends anyway. Do not turn the slot into a workout goal or a productivity experiment.',
          why: 'Recovery that has to be “useful” is still work. This slot is for dropping the day, not improving you.',
          check: 'You completed one timed slot with no output target.',
        }),
        step('🌙', 'Before bed', 'Close the loop on paper', {
          tip: 'Write tomorrow’s first concern on one line. Then put the notebook away. Do not add a second line. Do not open a device to “just check.”',
          how: 'One sentence: “Tomorrow I start with ___.” Close the notebook. Phone charges outside the bedroom if you can.',
          why: 'An unclosed loop is what steals sleep even when the day looked fine.',
          check: 'One written line exists, and the device is not in the bed.',
        }),
      ],
      'Tonight ends at a real time, with three or fewer live items and one recovery slot actually taken.',
    ),
    phase(
      'boundary',
      2,
      2,
      'Day 2',
      'One honest delay',
      'Mild strain creeps back through extra yeses. Today you install a delay before the next commitment lands.',
      [
        step('✋', 'When asked', 'Delay the next yes', {
          tip: protocolTip(
            p1,
            'Before accepting any new request, wait two hours. Reply that you will confirm after you check your plate.',
            'Do not fill the silence with a yes. Check the three-item list before you decide.',
          ),
          how: 'When the ask arrives: 1) Do not answer in the same thread. 2) Send the delay line. 3) Check the three-item list before you decide. If it does not fit, it waits or it replaces something.',
          why: trapWhy(p1, 'A fast yes is how a healthy week becomes a packed one. The delay is the whole intervention.'),
          script: 'I will confirm after I check my plate. I will get back to you later today.',
          check: 'At least one request was delayed instead of accepted on the spot.',
          protocol: p1,
        }),
        step('☀️', 'Morning', 'Inbox last', {
          tip: flavor.morningBuffer,
          how: 'Do the buffer first. Then open messages. If you already opened them, close them and still take the ten minutes. The miss does not cancel the rule.',
          why: 'Starting in other people’s priorities trains the day to belong to them.',
          check: 'Ten minutes passed before the first inbox or chat.',
        }),
        step('💬', 'Afternoon', 'One real check-in', {
          tip: flavor.people,
          how: 'Pick one person. Name one thing that is actually on your plate. Do not turn it into a vent marathon or a performance of being fine.',
          why: 'Isolation and over-socialising both refill strain. One bounded contact is the middle path.',
          script: 'I am keeping this week tight. Can we keep this to one hour / a walk?',
          check: 'You had one bounded contact, or you chose solo on purpose.',
        }),
        step('🌙', 'Evening', 'Repeat the stop time', {
          tip: 'Write tonight’s stop time before mid-afternoon. Same rule as Day 1: close the last tab, leave the unfinished item.',
          how: 'Reuse yesterday’s time unless it was fantasy. If you blew past it, pull it 30 minutes earlier tonight, not later.',
          why: 'A stop time only works if it survives a second day.',
          check: 'Work ended within 20 minutes of the written time.',
        }),
      ],
      'At least one request was delayed, and the stop time held a second night.',
    ),
    phase(
      'hold',
      3,
      3,
      'Day 3',
      'Lock the floor for next week',
      'The job today is to keep what worked, not to invent a new routine. Write the rules down so they outlast the mood.',
      [
        step('🧱', 'Morning', 'Keep yesterday’s rules', {
          tip: 'Do not add a new habit. Re-run the stop time, the three-item cap, and the delay. If you want to “optimise,” that urge is the leak.',
          how: 'Write three lines at the top of the day: stop time, live list of three, delay rule. That is the whole plan.',
          why: leadWhy(ctx, 'Maintenance fails when feeling fine becomes permission to reload.'),
          check: 'No new self-improvement task was added today.',
        }),
        step('⚙️', 'When tempted', 'Use the second constraint', {
          tip: protocolTip(
            p2,
            'Write a done-enough line before you start the next task. Stop when you hit it, even if more polish is possible.',
            'Put leftover polish on the later list. Do not reopen the file to “just finish it.”',
          ),
          how: 'Before starting: one sentence for “done enough.” When you hit it, close the file. Put leftover polish on the later list.',
          why: trapWhy(p2, 'Polish after “good enough” is how healthy weeks quietly refill.'),
          check: 'You stopped at a written done-enough line at least once.',
          protocol: p2,
        }),
        step('📋', 'End of day', 'Three-line review', {
          tip: 'Write three lines: what you protected, what almost crept back, what you will refuse next week. Keep it to three lines.',
          how: 'No journaling dump. Three bullets only. Put them where Monday-you will see them.',
          why: 'Without a written floor, next week’s calendar will eat this.',
          check: 'Three written lines exist for next week.',
        }),
        step('🌿', 'Evening', 'Recovery in your shape', {
          tip: flavor.people,
          how: 'Take the same timed slot as Day 1. Same length. Do not upgrade it into a project.',
          why: 'Repeating the slot is how it becomes a floor instead of a one-off treat.',
          check: 'The recovery slot happened again, same length as Day 1.',
        }),
      ],
      'The three rules (stop time, delay, three-item cap) are written down for next week.',
    ),
  ];
}

function buildMild(flavor, p1, p2, ctx) {
  return [
    phase(
      'cut',
      1,
      1,
      'Day 1',
      'Cut one demand today',
      'Load is rising. Shrink something real in the next 24 hours. A plan that starts with extra habits will fail.',
      [
        step('🛑', 'This morning', 'Name the thing that comes off', {
          tip: 'Pick one non-essential task, meeting, or favour that is still on this week. It has to be visible to someone else, not a private hope. Write it down before you open the inbox.',
          how: 'List everything still owed this week. Circle one that is not safety-critical. That is the cut. If you cannot find one, the cut is a meeting you do not need to attend live.',
          why: leadWhy(ctx, 'Rising load does not drop by wishing. Something has to leave the plate today.'),
          check: 'One specific item is named as moving or dropping.',
        }),
        step('📤', 'Before noon', 'Tell the relevant person', {
          tip: 'Send the move. Do not wait until you feel ready. Do not offer three replacement options in the same message. One change, one new time or owner.',
          how: 'Write the message, sit for two minutes, send it. Then stop renegotiating with yourself.',
          why: 'The cut is not real until someone else knows. Private postponement is how the item returns tonight.',
          script: 'I need to move [X] off this week. I can do [Y] by [day], or it will wait until next week.',
          check: 'The message is sent, not drafted.',
        }),
        step('😴', 'Tonight', 'Screens-off buffer', {
          tip: 'Set a screens-off time 30 minutes before bed. Put the phone outside the bedroom if you can. If you need an alarm, use a cheap clock or the phone in the next room.',
          how: 'Pick the time now. Enable downtime or a bedtime alarm. The last 30 minutes are for washing up, paper, or nothing. Not a “quick check.”',
          why: 'A rising-load week is often a late-screen week. Sleep is the first system that fails.',
          check: 'Phone is not in the bed for the last 30 minutes.',
        }),
        step('🌙', 'Before bed', 'Minimum day for tomorrow', {
          tip: 'Write three items for tomorrow, then stop. If a fourth appears, it replaces one of the three or it waits.',
          how: 'Paper, not a new app. Three lines. Put the later list on a separate page so it cannot merge.',
          why: 'An unbounded tomorrow will eat today’s cut.',
          check: 'Tomorrow has three written items, not a brain dump.',
        }),
      ],
      'One demand has been moved in writing, and tomorrow is capped at three items.',
    ),
    phase(
      'hygiene',
      2,
      3,
      'Days 2–3',
      'Quiet the inputs',
      'Recovery fails when the day never actually ends. These two days are for making the day have edges.',
      [
        step('🔕', 'Both days', 'Two message windows', {
          tip: 'Mute non-urgent notifications. Check messages twice a day, 15 minutes each. No third window, including “just this once.” If something is truly urgent, people already have another way to reach you.',
          how: 'Turn off badges on work chat and email. Put two calendar holds: late morning and late afternoon. Outside those, the apps stay closed.',
          why: 'Constant pings keep the nervous system on-call. Two windows return the day to you in chunks you can finish.',
          check: 'You can name the two window times, and a third check did not happen.',
        }),
        step('☀️', 'Mornings', 'Inbox last', {
          tip: flavor.morningBuffer,
          how: 'Do the buffer. Then one work item from the three-item list. Then the first message window. That order is the rule.',
          why: 'Opening chat first donates the morning to whoever shouted.',
          check: 'Inbox was not the first thing you touched.',
        }),
        step('🛡', 'Afternoons', 'Hold yesterday’s cut', {
          tip: 'Do not take back the item you moved on Day 1. If guilt shows up, reread the sent message and leave it sent.',
          how: 'When the urge to “just squeeze it in” appears, write it on the later list. Do not reopen the negotiation.',
          why: 'The first 48 hours after a cut are when people (including you) try to reverse it.',
          check: 'The Day 1 cut is still off the live list.',
        }),
        step('🌿', 'Evenings', 'Take the recovery slot', {
          tip: flavor.move,
          how: 'Same 15-minute timer both nights. Same place if you can. Do not skip Day 3 because Day 2 felt slightly better.',
          why: 'Two nights in a row is what turns a slot into a floor.',
          check: 'The slot happened on both nights.',
        }),
      ],
      'Messages are checked twice a day, and the Day 1 cut has not crept back.',
    ),
    phase(
      'protocol',
      4,
      5,
      'Days 4–5',
      'Install one constraint',
      'A trait trap will try to refill the plate. These two days you run one written rule until it is boring.',
      [
        step('⚙️', dayLabel(4, 5), 'Run the protocol', {
          tip: protocolTip(
            p1,
            'Write a done-enough line before you start. Stop when you hit it.',
            'Put the rule at the top of today’s note and run it when the trigger happens. Do not improve the rule. Just run it.',
          ),
          how: 'Put the rule at the top of today’s note. Each time the trigger happens, follow the rule once. Do not improve the rule. Just run it.',
          why: trapWhy(p1, 'Without a written constraint, rising load comes back through personality, not through “not trying hard enough.”'),
          check: 'You used the rule at least twice across these two days.',
          protocol: p1,
        }),
        step('✋', 'When asked', 'Keep the two-hour delay', {
          tip: 'Any new request waits two hours. If they need an answer now, the answer is not yes. It is “I will confirm after I check.”',
          how: 'Draft the delay line in notes so you can paste it. Do not explain your whole week in the reply.',
          why: 'Speed-to-yes is the refill mechanism. Delay is cheaper than a later collapse.',
          script: 'I will confirm after I check my plate. I will reply later today.',
          check: 'No new yes went out in the same minute as the ask.',
        }),
        step('📅', 'Both days', 'Protect the stop time', {
          tip: 'Write the stop time before noon. When it hits, leave. If a meeting overruns, still end your own work at that time.',
          how: 'Calendar alert 10 minutes before. Use the 10 minutes to write the close-out line, then stop.',
          why: 'A constraint that only works on easy days is not a constraint.',
          check: 'Both days ended within 20 minutes of the written time.',
        }),
        step('🌿', 'Evenings', 'Recovery before extra', {
          tip: flavor.move,
          how: 'The slot happens before extra work or scrolling. If you missed it by 9pm, take 10 minutes anyway rather than skipping.',
          why: 'Putting recovery last means it never happens on a rising-load week.',
          check: 'Recovery happened before the late-night extra, both nights.',
        }),
      ],
      'The protocol rule was used in real situations, not just written down.',
    ),
    phase(
      'lock',
      6,
      7,
      'Days 6–7',
      'Lock what worked',
      'End of the week is where people add a new project. You review, then keep the same rules.',
      [
        step('📋', 'Day 6', 'Three-line review', {
          tip: p2?.protocol_rule
            ? `${p2.protocol_rule} Then write three lines: what you dropped, what still drained you, what you will refuse next week.`
            : 'Write three lines: what you dropped, what still drained you, what you will refuse next week.',
          how: 'Sit for ten minutes with paper. Three bullets only. If you want to write a manifesto, that is the trap. Stop at three.',
          why: trapWhy(p2, 'A long review becomes another performance. Three lines are enough to steer next week.'),
          check: 'Three lines exist, and no fourth habit was added.',
          protocol: p2,
        }),
        step('🧱', 'Day 7', 'Carry two rules forward', {
          tip: 'Pick two rules from this week (example: two message windows, stop time, delay). Put them on next week’s Monday note now.',
          how: 'Write them at the top of next week’s list. Delete any new “while I’m at it” goals.',
          why: 'Seven days of effort disappears if Monday starts empty.',
          check: 'Next week already has two written rules.',
        }),
        step('💬', 'This weekend', 'Recovery in your shape', {
          tip: flavor.people,
          how: 'One bounded social, or a clean solo block. Not both stacked. Not a make-up marathon for the week.',
          why: 'Weekends are where mild strain either resets or doubles through catch-up and over-socialising.',
          check: 'You can name what you did not do this weekend in order to recover.',
        }),
        step('🔁', 'Day 7 evening', 'Do not restart', {
          tip: 'If you feel slightly better, do not reload the plate. Compare energy to Day 1 in one sentence. Keep the constraints that worked.',
          how: 'One sentence in the same note as the three-line review. Then close it.',
          why: leadWhy(ctx, 'Feeling a bit better is not a signal to catch up. It is a signal the cuts were doing their job.'),
          check: 'No new project was added because you felt better.',
        }),
      ],
      'Next week already has two written rules, and the Day 1 cut is still off the plate.',
    ),
  ];
}

function buildModerate(flavor, p1, p2, ctx) {
  return [
    phase(
      'stabilize',
      1,
      1,
      'Day 1',
      'Stabilize the next 24 hours',
      'You are in sustained strain. Today is for stopping the bleed, not catching up. Do not design a new life. Make today livable.',
      [
        step('📅', 'This morning', 'Block 30 minutes of rest', {
          tip: 'Put a 30-minute rest block on today with no productivity goal. Treat it like a meeting you cannot skip. If the calendar is packed, the block replaces the least essential meeting, it does not squeeze into the gaps.',
          how: 'Open the calendar. Place the block. Tell whoever needs to know that you are unavailable then. When it starts, leave the desk. Phone in another room.',
          why: leadWhy(ctx, 'Sustained strain does not lift from more effort. A protected empty block is the first proof the day can have an edge.'),
          check: 'A 30-minute block exists on the calendar and you were not working through it.',
        }),
        step('🎯', 'Today', 'Three priorities only', {
          tip: 'Write three priorities for this week. Everything else waits. If a fourth item appears, it replaces one of the three or it waits. This is a week list, not a life list.',
          how: 'Paper. Three lines. A second page labelled “later.” Do not decorate it. If you cannot choose, pick the three that would still matter if you got sick tomorrow.',
          why: 'An unbounded week is how moderate strain stays moderate forever.',
          check: 'The live week list has three items.',
        }),
        step('🛑', 'This afternoon', 'Move one visible demand', {
          tip: 'Send one message that moves a task, meeting, or favour. Private hoping does not count. One concrete change in the next 24 hours.',
          how: 'Name the item. Name the new time or owner. Send. Then do not soften it with three extras you will “still try to do.”',
          why: 'Stabilising without a visible cut just rearranges the same overload.',
          script: 'I am at capacity this week. [X] needs to move to [day/person]. I will pick it up then.',
          check: 'The message is sent.',
        }),
        step('🌙', 'Evening', 'Close the loop on paper', {
          tip: flavor.move,
          how: 'After the recovery slot, write tomorrow’s three items. Phone charges outside the bedroom. Do not reopen work “to feel ready.”',
          why: 'The night is where moderate strain turns into rumination. Paper closes the loop better than another pass at the laptop.',
          check: 'Tomorrow has three lines, and the recovery slot happened.',
        }),
      ],
      'Today had a rest block, a three-item week list, and one demand moved in writing.',
    ),
    phase(
      'shrink',
      2,
      3,
      'Days 2–3',
      'Shrink the plate',
      'The trait that over-functions will try to refill the list. Hold the constraint even when it feels rude.',
      [
        step('⚙️', dayLabel(2, 3), 'Enforce the trap rule', {
          tip: protocolTip(
            p1,
            'Use a 2-hour delay before accepting any new request.',
            'Put the rule at the top of both days. Each time the trigger fires, run it once and log a tick mark.',
          ),
          how: 'Put the rule at the top of both days. Each time the trigger fires, run the rule once. Log a tick mark. Two ticks a day is enough.',
          why: trapWhy(p1, 'Sustained strain is often a personality loop, not a time-management gap. The rule has to fire in the moment.'),
          check: 'The rule was used on both days, not only written.',
          protocol: p1,
        }),
        step('🔕', dayLabel(2, 3), 'Cut the noise', {
          tip: 'Mute non-urgent notifications for 48 hours. Two short check windows only, 15 minutes each. If your job requires on-call, mute everything that is not the on-call channel.',
          how: 'Disable badges. Calendar the two windows. Tell one colleague how to reach you for true blockers.',
          why: 'An always-on channel keeps exhaustion high even when the task list is smaller.',
          script: 'I am checking messages at 11:00 and 16:00. If something is blocking, call or text.',
          check: 'Two windows only, both days.',
        }),
        step('✋', 'When asked', 'One hard no', {
          tip: 'Say no to one new request before taking on anything else. You already have three weekly items. A fourth is a replacement, not an addition.',
          how: 'Use a short line. Do not write a defence of your character. Offer a later window only if it is real.',
          why: 'Days 2–3 are when people test whether Day 1 was a mood. A no makes it a policy.',
          script: 'I cannot take that on this week. I can revisit it after [day], or it needs another owner.',
          check: 'One no was sent, not only thought.',
        }),
        step('🌿', 'Evenings', 'Recovery before extra', {
          tip: flavor.move,
          how: 'Timer first, extra work never. If extra work still happens, it happens after the slot, and only from the three-item list.',
          why: 'Extra after hours is how the shrink reverses overnight.',
          check: 'Both evenings had the slot before any extra.',
        }),
      ],
      'The protocol fired in real requests, and a no went out in writing.',
    ),
    phase(
      'cover',
      4,
      6,
      'Days 4–6',
      'Get one person in the loop',
      'Carrying this alone is part of the strain. You need one concrete help, not a speech about how tired you are.',
      [
        step('💬', dayLabel(4, 6), 'Ask for one concrete help', {
          tip: 'Tell one trusted person you are depleted. Name one thing they can take, cover, or check in on before the week ends. Vague “I am struggling” without a request usually changes nothing.',
          how: 'Pick the person. Pick the ask. Send it in writing so it cannot be half-heard. Then let them answer. Do not apologise twice in the same message.',
          why: leadWhy(ctx, 'Moderate strain lasts when it stays private. One specific handoff is the intervention.'),
          script: 'I am depleted this fortnight. Can you take [X] until [day], or check in with me on [day] about [Y]?',
          check: 'A specific ask is sent to a named person.',
        }),
        step('⚙️', dayLabel(4, 6), 'Second constraint', {
          tip: protocolTip(
            p2,
            'Send one ownership message: you can own A or B by Friday, not both.',
            'If two things are both urgent, write A or B, send the choice, and do not secretly try to do both.',
          ),
          how: 'If two things are both “urgent,” write A or B. Send the choice. Do not secretly try to do both.',
          why: trapWhy(p2, 'The second trap is how the plate refills after the first rule starts working.'),
          check: 'You chose A or B in writing at least once.',
          protocol: p2,
        }),
        step('📅', 'Each morning', 'Rewrite the three', {
          tip: 'Each morning, rewrite the three-item list from scratch. If you finish early, stop. Do not pull from the backlog for sport.',
          how: 'New page daily. Copy only what still matters. Finished items come off. New items must replace, not stack.',
          why: 'A stale list grows. A rewritten list stays honest.',
          check: 'Each of these mornings started with a fresh three.',
        }),
        step('🌙', 'Evenings', 'Keep the rest block idea small', {
          tip: flavor.people,
          how: 'One bounded contact or a clean solo slot. Not a catch-up tour of everyone you have neglected.',
          why: 'Support that turns into more performing is not support.',
          check: 'Evenings stayed bounded.',
        }),
      ],
      'One person has a specific ask, and the live list is still three.',
    ),
    phase(
      'hold-week',
      7,
      10,
      'Days 7–10',
      'Hold the new floor',
      'This stretch is where old habits return because you feel slightly less wrecked. Keep the rules. Do not add a transformation.',
      [
        step('🧱', dayLabel(7, 10), 'Keep the three-item cap', {
          tip: 'Each morning, rewrite the three-item list. If you finish early, stop. The backlog is not a reward for having capacity.',
          how: 'Same ritual: three lines, later page, stop. If a manager adds a fourth, ask which of the three comes off.',
          why: 'The second week is a refill test. The cap is how you pass it.',
          script: 'I can take that if we move [item] off this week. Which should come off?',
          check: 'No day in this window had more than three live items.',
        }),
        step('⚙️', 'When the trap fires', 'Keep running the first rule', {
          tip: protocolTip(
            p1,
            'Delay new requests two hours. Confirm only after you check the three-item list.',
            'The rule is not done because you used it last week. Use it again every time the trigger appears.',
          ),
          how: 'The rule is not done because you used it last week. Use it again every time the trigger appears.',
          why: trapWhy(p1, 'Protocols die when they are treated as a one-off insight.'),
          check: 'The rule still has tick marks in this window.',
          protocol: p1,
        }),
        step('🌿', 'Daily', 'Recovery in your shape', {
          tip: flavor.move,
          how: 'Keep the timed slot. Same length. If you miss a day, restart the next day without a make-up double session.',
          why: 'Doubling after a miss is another over-function. Restart is enough.',
          check: 'The slot happened on at least three of these four days.',
        }),
        step('😴', 'Nights', 'Protect the screens-off buffer', {
          tip: '30 minutes before bed, screens off. The phone leaves the pillow. If you need to dump a thought, paper only.',
          how: 'Same bedtime alarm as week one. Do not “catch up on messages” in bed as a reward for getting through the day.',
          why: 'Sleep is the floor under every other rule. Late screens quietly erase the week.',
          check: 'Most nights in this window had the 30-minute buffer.',
        }),
      ],
      'The three-item cap survived the first “I feel a bit better” moment.',
    ),
    phase(
      'recheck',
      11,
      14,
      'Days 11–14',
      'Re-check, do not restart',
      'The last days of this plan are for keeping the floor, then deciding one next support. Not a new personality project.',
      [
        step('🔁', 'Day 11–13', 'Keep what worked', {
          tip: 'Do not add a new habit. Re-run stop time, three-item cap, delay, and the recovery slot. If you want to overhaul, write the idea on a later list dated after Day 14.',
          how: 'Morning note: the same four rules. That is the plan. Delete anything that starts with “while I’m at it.”',
          why: leadWhy(ctx, 'Feeling slightly better is the most common moment people reload. Holding is the win.'),
          check: 'No new self-improvement project started in this window.',
        }),
        step('🤝', 'By Day 13', 'Follow up on the ask', {
          tip: 'If Day 4–6 support stalled, follow up once. If it landed, keep the change. Do not add a second transformation on top.',
          how: 'One short follow-up, or one thank-you plus the continued arrangement. Then stop campaigning.',
          why: 'Cover that was asked for and never confirmed becomes another open loop.',
          script: 'Checking in on [X]. Can we keep that cover through [day], or do we need another plan?',
          check: 'The original ask is either confirmed, adjusted, or consciously dropped.',
        }),
        step('🩺', 'Day 14', 'One sentence, one next step', {
          tip: 'Compare energy to Day 1 in one sentence. Then write one next step: keep these rules, ask for more workplace cover, or get professional support. One, not ten.',
          how: 'Ten minutes, paper. Sentence one: energy vs Day 1. Sentence two: the next step. Close the notebook.',
          why: 'A 14-day plan that ends in a new ten-item programme was never a recovery plan.',
          check: 'Two sentences exist, and no new programme was launched.',
        }),
        step('🌿', 'This stretch', 'Recovery in your shape', {
          tip: flavor.people,
          how: 'Keep social and solo in the same bounded shape as week one. Do not celebrate Day 14 by overbooking the weekend.',
          why: 'The celebration binge is a classic refill. Same floor, including the last weekend.',
          check: 'The last weekend did not undo the three-item logic.',
        }),
      ],
      'You have a one-sentence comparison to Day 1 and one next step, with the same rules still on the page.',
    ),
  ];
}

function buildSevere(flavor, p1, p2, ctx) {
  return [
    phase(
      'safety',
      1,
      1,
      'Day 1',
      'Get support in the room',
      'This range is a strong signal to reduce load and get help, not to push harder. Today you make the day smaller and tell one real person. This is not a diagnosis.',
      [
        step('🆘', 'Today', 'Tell one real person', {
          tip: 'Talk today to a manager, coach, trusted person, or professional about your load. Ask for one concrete change this week. A journal entry does not count. Someone else has to hear it.',
          how: 'Pick the person who can actually change something, or who can sit with you while you find that person. Message them to set a time today. If speaking is hard, send the script in writing.',
          why: leadWhy(ctx, 'Severe strain is not a willpower problem. Isolation keeps the overload in place.'),
          script: 'I am at the end of my capacity. I need one change this week: [cover / deadline move / time off / a check-in]. Can we do that?',
          check: 'A real person has been told, today.',
        }),
        step('🏠', 'Today', 'Minimum viable day', {
          tip: 'Define the smallest version of a livable day: sleep, food, one essential task. Aim only for that until tomorrow. Everything else is later, even if it feels urgent.',
          how: 'Write three lines: when you will eat, when you will sleep, the one essential task. Do that list. If the essential task is also too big, shrink it to a 25-minute version.',
          why: 'A full-performance day on top of this score is how people get more hurt. Tiny is the plan.',
          check: 'You can show a three-line livable day, and you did not add a fourth “while I’m at it.”',
        }),
        step('🍽', 'Meals', 'Eat something actual', {
          tip: 'Put food on a plate at least twice today. Not a productivity hack. Blood sugar and sleep are part of the floor. If cooking is too much, the simplest food you will actually eat is enough.',
          how: 'Set two meal alarms. Sit down for ten minutes. No inbox during the meal.',
          why: 'Under severe strain, basic needs get treated as optional. They are not optional.',
          check: 'Two sitting-down meals happened.',
        }),
        step('💤', 'Tonight', 'Protect sleep like a medical appointment', {
          tip: 'Screens off 30 minutes before bed. Phone outside the room if you can. If sleep is already broken, still do the wind-down. Do not use the night to catch up on work.',
          how: 'Write the one essential task for tomorrow, then stop. Lights down. If thoughts spiral, paper only, one page max.',
          why: 'Night work after a severe-range day is not catching up. It is more of the same injury.',
          check: 'You attempted a real wind-down instead of working through the night.',
        }),
      ],
      'One person knows, and today was a livable minimum rather than a catch-up day.',
    ),
    phase(
      'stop',
      2,
      4,
      'Days 2–4',
      'Stop adding',
      'Nothing new lands on the plate until something comes off. These days are for nos, delays, and a tiny repeating floor.',
      [
        step('🛑', dayLabel(2, 4), 'One hard no', {
          tip: 'Say no to one new request before taking on anything else. Script it short. You do not owe a biography.',
          how: 'Send the no the same day the ask arrives. If you already said maybe, convert it to no or to a date after Day 10.',
          why: 'Severe range plus new commitments is how a crash gets worse. The no is the treatment.',
          script: 'I cannot take that on right now. I need to keep my plate at the minimum until [day].',
          check: 'At least one no is in writing in this window.',
        }),
        step('⚙️', dayLabel(2, 4), 'Install the protocol', {
          tip: protocolTip(
            p1,
            'Write tomorrow’s top concern on one line, then close the notebook.',
            'The rule goes at the top of each day. Run it when the trigger happens. Do not upgrade it into a system.',
          ),
          how: 'The rule goes at the top of each day. Run it when the trigger happens. Do not upgrade it into a system.',
          why: trapWhy(p1, 'Your usual coping style is part of how the overload got this high. The protocol interrupts it.'),
          check: 'The rule was used on at least two of these three days.',
          protocol: p1,
        }),
        step('🏠', 'Each day', 'Keep the minimum viable day', {
          tip: 'Sleep, food, one essential task. Repeat. If you have leftover energy, rest. Do not pull from the backlog to “use” the energy.',
          how: 'Rewrite the three-line livable day each morning. The essential task can be the same all three days.',
          why: 'Leftover energy is for the body, not for proving you are back.',
          check: 'No day in this window had a full catch-up list.',
        }),
        step('🌿', 'Nights', 'Recovery before extra', {
          tip: flavor.move,
          how: 'Choose one recovery action before extra work or scrolling. If extra still happens, it is after, and only the one essential task.',
          why: 'Scrolling and extra work are the usual night-time leak. Recovery has to go first or it does not happen.',
          check: 'Recovery came before extra on at least two nights.',
        }),
      ],
      'Something was refused, and the days stayed at a livable minimum.',
    ),
    phase(
      'cover',
      5,
      10,
      'Days 5–10',
      'Build cover, not willpower',
      'Severe strain does not yield to more effort. You need fewer obligations and more backup, in writing.',
      [
        step('🤝', dayLabel(5, 10), 'Ask for cover', {
          tip: 'Name one recurring obligation someone else can take for two weeks. Ask once, in writing. Recurring means it would otherwise keep hitting you every few days.',
          how: 'Pick the obligation. Pick the person with actual access to it. Send the ask. If they cannot, ask who can. Do not secretly keep doing it while you wait.',
          why: leadWhy(ctx, 'Willpower is already spent. Cover is the remaining lever.'),
          script: 'I need [task] covered until [date]. Can you take it, or help me find who can?',
          check: 'A cover request is sent for a named recurring item.',
        }),
        step('📋', dayLabel(5, 10), 'Hold the second rule', {
          tip: protocolTip(
            p2,
            'Log three completed items before opening a new one.',
            'Keep a paper tick list. New work only after three finished ticks from the minimum day, not from a hidden extra list.',
          ),
          how: 'Keep a paper tick list. New work only after three finished ticks, and those ticks have to be from the minimum day, not from a hidden extra list.',
          why: trapWhy(p2, 'The second trap is how people in this range “help” their way back into overload.'),
          check: 'You refused at least one new open loop because the rule said so.',
          protocol: p2,
        }),
        step('📅', 'Each morning', 'One essential task', {
          tip: 'Still only one essential task per day, plus food and sleep. If work demands more, ask which item is the actual essential, in writing.',
          how: 'Morning three lines. If a fourth is demanded, send: “I can do A today. B has to move.”',
          why: 'A six-item “minimum” is not a minimum. It is the old week in a new outfit.',
          script: 'I can complete [A] today. [B] will have to wait until [day] unless we drop [A].',
          check: 'Each morning list stayed at one essential task.',
        }),
        step('🌿', 'Daily', 'Keep the floor tiny', {
          tip: flavor.move,
          how: 'Same short slot most days. Missing one day is allowed. Doubling the next day is not.',
          why: 'Tiny and repeatable beats heroic and abandoned.',
          check: 'The slot happened on at least four of these six days.',
        }),
      ],
      'Cover has been asked for, and days are still one-essential-task days.',
    ),
    phase(
      'rebuild',
      11,
      16,
      'Days 11–16',
      'Rebuild one loop only',
      'Do not redesign your life. Restore one daily loop that actually restores you. Everything else waits.',
      [
        step('🔁', dayLabel(11, 16), 'One repeatable hour', {
          tip: 'Pick one hour that is the same every day (morning buffer, walk, or screens-off). Protect it even if the rest of the day is messy. Same time, same length.',
          how: 'Put it on the calendar as busy. Tell one person it exists. If it gets interrupted, move it the same day rather than cancelling.',
          why: 'One reliable loop is how the nervous system starts to trust the floor. Ten new habits will not.',
          check: 'The same hour showed up on at least four of these six days.',
        }),
        step('💬', dayLabel(11, 16), 'Follow up on help', {
          tip: 'If Day 1 or Days 5–10 support stalled, follow up once. If it landed, keep the change. Do not add a second transformation.',
          how: 'One message. Confirm the cover dates. If cover failed, name the next person. Then stop.',
          why: 'Unconfirmed help is another open loop, and open loops are load.',
          script: 'Following up on [cover]. Can we keep this through [date]?',
          check: 'Help is confirmed, adjusted, or a next person is named.',
        }),
        step('⚙️', 'When the trap fires', 'Keep the first protocol', {
          tip: protocolTip(
            p1,
            'Delay, delay, delay. No same-minute yes.',
            'The hour you are rebuilding is not a reason to start saying yes again. The protocol still runs.',
          ),
          how: 'The hour you are rebuilding is not a reason to start saying yes again. The protocol still runs.',
          why: trapWhy(p1, 'Feeling slightly more human is when the old yes-pattern returns.'),
          check: 'At least one delayed or refused request in this window.',
          protocol: p1,
        }),
        step('🌙', 'Nights', 'Sleep still comes first', {
          tip: 'The rebuilt hour does not replace sleep. Screens-off buffer stays. Night work stays off the table.',
          how: 'If the repeatable hour is evening, it ends before the wind-down, it does not eat it.',
          why: 'A new loop that steals sleep is not recovery. It is a rebrand.',
          check: 'Wind-down still happened on most nights.',
        }),
      ],
      'One daily hour is repeating, and cover is confirmed or re-asked.',
    ),
    phase(
      'hold',
      17,
      21,
      'Days 17–21',
      'Hold, then reassess',
      'The last stretch is for keeping the floor, not proving you are back. Then one decision about ongoing support.',
      [
        step('🧱', dayLabel(17, 21), 'No new projects', {
          tip: 'If an idea appears, write it on a later list dated after Day 21. This window is for maintenance only. Feeling more able is not a green light to catch up on everything you dropped.',
          how: 'Later list lives on a separate page. You may add to it. You may not start from it until after Day 21.',
          why: leadWhy(ctx, 'The last five days are the classic relapse window. Holding is the outcome.'),
          check: 'Nothing new was started from the later list.',
        }),
        step('🤝', 'This stretch', 'Keep the cover', {
          tip: 'Do not snatch the obligation back because you feel guilty. Cover lasts until the date you asked for. Guilt is not data.',
          how: 'If you want to take it back early, wait until Day 21 and decide then, in writing, with the other person.',
          why: 'Snatching work back is the old over-function, not recovery.',
          check: 'The covered item stayed covered through this window.',
        }),
        step('🩺', 'Day 21', 'Decide the next support', {
          tip: 'Write whether you need more professional, workplace, or personal cover. One next step, not ten. If you are still in this range, the next step is more help, not a stricter personal routine.',
          how: 'Ten minutes. Two sentences: compared with Day 1, and the next support. Share it with the person from Day 1 if you can.',
          why: 'A 21-day plan that ends with “I should try harder” missed the point. The point was load and cover.',
          check: 'One next-support decision is written down.',
        }),
        step('🌿', 'This week', 'Recovery in your shape', {
          tip: flavor.people,
          how: 'Keep the repeatable hour. Keep social bounded. Do not celebrate Day 21 by overbooking.',
          why: 'The plan ends. The floor should not.',
          check: 'The repeatable hour still exists on Day 21.',
        }),
      ],
      'Cover held, no new project started, and one next-support decision is written.',
    ),
  ];
}

const BUILDERS = {
  healthy: buildHealthy,
  mild: buildMild,
  moderate: buildModerate,
  severe: buildSevere,
};

function intentFor(cls, horizon, ctx) {
  const who = ctx.archetype ? ` Built for ${ctx.archetype}.` : '';
  if (cls === 'healthy') {
    return `A ${horizon.days}-day day-by-day protocol to keep strain low: stop times, a three-item cap, and one delay rule.${who} One checklist per day.`;
  }
  if (cls === 'mild') {
    return `A ${horizon.days}-day day-by-day protocol to cut rising load: one visible demand comes off Day 1, then one checklist per day.${who}`;
  }
  if (cls === 'severe') {
    return `A ${horizon.days}-day day-by-day protocol for high strain: tell someone today, run a minimum viable day each day, then build cover.${who} This is not a diagnosis.`;
  }
  return `A ${horizon.days}-day day-by-day protocol for sustained strain: stabilize, shrink the plate, get one person in the loop, then hold the floor.${who}`;
}

function buildCtx(profile, flavor, p1, p2) {
  const diag = profile?.diagnostic_summary ?? {};
  return {
    flavor,
    p1,
    p2,
    archetype: diag.primary_archetype || '',
    conflict: diag.core_conflict || '',
    lead: diag.lead_dimension || '',
    stage: diag.burnout_stage || '',
  };
}

/**
 * Deterministic full recovery roadmap from burnout + psychometric protocols.
 * Pass `{ daily: false }` for the grouped skeleton used by the LLM rewriter.
 */
export function buildRecoveryRoadmap(
  {
    burnout,
    personality,
    psychometricProfile,
    recoveryPreferences,
  } = {},
  { daily = true } = {},
) {
  const cls = clsOf(burnout);
  const horizon = ROADMAP_HORIZON[cls];
  const profile = psychometricProfile ?? personality?.psychometricProfile ?? null;
  const flavor = recoveryFlavor(recoveryPreferences ?? personality?.recoveryPreferences);
  const p1 = protocolAt(profile, 0);
  const p2 = protocolAt(profile, 1);
  const ctx = buildCtx(profile, flavor, p1, p2);
  const grouped = BUILDERS[cls](flavor, p1, p2, ctx);
  const phases = daily ? expandToDailyPhases(grouped, horizon.days) : grouped;

  return {
    cls,
    horizonDays: horizon.days,
    horizonLabel: horizon.label,
    intent: intentFor(cls, horizon, ctx),
    archetype: ctx.archetype || personality?.type?.title || '',
    phases,
    locked: false,
    lockedPhaseCount: 0,
    guestPreview: false,
  };
}

/** Expand a grouped roadmap (or re-expand after LLM copy merge) into one phase per day. */
export function expandRoadmapToDaily(roadmap) {
  if (!roadmap?.phases?.length) return roadmap;
  if (isDailyPhasePlan(roadmap.phases, roadmap.horizonDays)) return roadmap;
  return {
    ...roadmap,
    phases: expandToDailyPhases(roadmap.phases, roadmap.horizonDays),
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
    outcome: p.outcome || '',
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

/** Old plans were 2 short cards per phase with no how/why/script. */
export function isThinRecoveryRoadmap(roadmap) {
  const phases = (roadmap?.phases ?? []).filter((p) => p && !p.locked);
  if (!phases.length) return true;
  const steps = phases.flatMap((p) => p.steps ?? []);
  if (steps.length < 3) return true;
  const detailed = steps.filter((s) => String(s.how || '').trim() && String(s.check || '').trim()).length;
  return detailed < Math.ceil(steps.length / 2);
}

export function hydrateRecoveryRoadmap(roadmap, ctx = {}, { guestPreview = false } = {}) {
  const needsRebuild =
    !roadmap || isThinRecoveryRoadmap(roadmap) || isGroupedRecoveryRoadmap(roadmap);
  const full = needsRebuild ? buildRecoveryRoadmap(ctx) : roadmap;
  if (!full) return roadmap;
  return guestPreview ? teaseRecoveryRoadmap(full) : full;
}

function optionalText(value) {
  const text = String(value ?? '').trim();
  return text || undefined;
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
    how: optionalText(raw.how),
    why: optionalText(raw.why),
    script: optionalText(raw.script),
    check: optionalText(raw.check ?? raw.done_when ?? raw.doneWhen),
    trigger: optionalText(raw.trigger),
    trap: optionalText(raw.trap),
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
    outcome: String(raw.outcome ?? ''),
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
        outcome: match.outcome || phaseItem.outcome,
        steps: phaseItem.steps.map((s, i) => {
          const next = match.steps[i];
          if (!next) return s;
          return {
            ...s,
            icon: next.icon || s.icon,
            title: next.title || s.title,
            tip: next.tip || s.tip,
            how: next.how || s.how,
            why: next.why || s.why,
            script: next.script || s.script,
            check: next.check || s.check,
          };
        }),
      };
    }),
  };
}
