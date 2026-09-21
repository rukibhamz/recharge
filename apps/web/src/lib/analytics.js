/**
 * Lightweight funnel analytics.
 * - Always emits a CustomEvent for local tooling
 * - Posts to PostHog if VITE_POSTHOG_KEY is set
 */

const QUEUE_KEY = 'recharge-analytics-queue-v1';

function posthogKey() {
  return String(import.meta.env.VITE_POSTHOG_KEY || '').trim();
}

function posthogHost() {
  return String(import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com').replace(/\/$/, '');
}

function distinctId() {
  if (typeof window === 'undefined') return 'server';
  try {
    const key = 'recharge-anon-id';
    let id = window.localStorage.getItem(key);
    if (!id) {
      id = `anon_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
      window.localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return `anon_session_${Date.now()}`;
  }
}

function enqueue(event, props) {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    list.push({ event, props, at: Date.now() });
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(list.slice(-100)));
  } catch {
    /* ignore */
  }
}

async function sendPosthog(event, props) {
  const key = posthogKey();
  if (!key || typeof fetch === 'undefined') return;

  await fetch(`${posthogHost()}/capture/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: key,
      event,
      properties: {
        ...props,
        distinct_id: distinctId(),
        $lib: 'recharge-web',
      },
      timestamp: new Date().toISOString(),
    }),
    keepalive: true,
  }).catch(() => {});
}

/**
 * Track a funnel or product event.
 * @param {string} event
 * @param {Record<string, unknown>} [props]
 */
export function track(event, props = {}) {
  if (!event) return;
  const payload = { ...props };

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('recharge:analytics', { detail: { event, props: payload } }));
  }

  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug('[analytics]', event, payload);
  }

  enqueue(event, payload);
  sendPosthog(event, payload);
}

export const Funnel = {
  assessmentStarted: () => track('assessment_started'),
  phaseCompleted: (phase) => track('phase_completed', { phase }),
  assessmentCompleted: (cls) => track('assessment_completed', { burnout_cls: cls || null }),
  resultsViewed: (cls) => track('results_viewed', { burnout_cls: cls || null }),
  roadmapDayCompleted: (dayKey, sessionId) =>
    track('roadmap_day_completed', { day_key: dayKey, session_id: sessionId || null }),
  roadmapUnlocked: () => track('roadmap_unlocked'),
  resultsEmailed: (newsletter) => track('results_emailed', { newsletter_opt_in: Boolean(newsletter) }),
  signinPromptShown: (source) => track('signin_prompt_shown', { source: source || 'results' }),
  coachOpened: () => track('coach_opened'),
  coachMessageSent: () => track('coach_message_sent'),
};
