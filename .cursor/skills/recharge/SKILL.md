---
name: recharge
description: >
  Build, extend, debug, or deploy any part of the Recharge burnout and personality assessment
  platform. Use this skill whenever the conversation involves: the Recharge app architecture,
  adding or modifying assessment questions, changing the scoring engine, working on the AI
  recommendation layer (Google Gemini API), Supabase database and auth, building the PWA manifest or
  service worker, implementing the B2B team dashboard, the results/sharing screens, database
  schema, authentication flows, or any deployment/infrastructure task for this product.
  Also triggers for: Gemini model selection, Supabase schema/migrations, RLS policies, or scaling
  the platform. If the user mentions "Recharge", "burnout app",
  "personality assessment platform", or any component described in this skill — use it.
---

# Recharge — Platform Skill

Recharge is a PWA combining a burnout diagnostic + personality profiler with AI-powered
personalised recommendations. This skill contains everything needed to build, extend, and
deploy the full platform.

**Read order:**
1. This file — architecture, scoring, AI layer, component map
2. `DESIGN.md` (or `references/DESIGN.md`) — canonical design system (colors, typography, components)
3. `supabase/migrations/` — schema and RLS policies
4. `references/deployment.md` — Vercel + Railway setup, env vars, CI/CD (when available)

**Canonical stack (project decision):** Google Gemini for AI, Supabase for database + auth (v1.1).

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        CLIENT                           │
│  React PWA (Vite + Tailwind)                            │
│  ├── Service Worker (Workbox) — offline + caching       │
│  ├── App Manifest — installable on iOS / Android        │
│  ├── Assessment Engine — question state machine         │
│  ├── Scoring Engine — burnout % + personality type      │
│  ├── Results Screen — score ring, traits, rec cards     │
│  └── B2B Dashboard — aggregate team views (v1.1)        │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS / REST
┌────────────────────▼────────────────────────────────────┐
│                    API SERVER                           │
│  Node.js / Express                                      │
│  ├── POST /assess        — submit responses, get recs   │
│  ├── POST /auth/magic    — email magic link (optional)  │
│  ├── GET  /history/:uid  — past assessments             │
│  ├── POST /team/invite   — B2B workspace invite         │
│  └── GET  /team/:id/data — anonymised team aggregates   │
└──────┬─────────────────────┬───────────────────────────┘
       │                     │
┌──────▼──────┐    ┌─────────▼──────────────────────────┐
│  Supabase   │    │         AI LAYER                   │
│  PostgreSQL │    │  Primary: Google Gemini API        │
│  + Auth     │    │  Fallback: static rec cards        │
│  + RLS      │    │                                    │
│  sessions   │    │  Input: burnout level + personality│
│  users      │    │  Output: JSON array of 4 rec cards │
│  teams      │    │  (no PII in prompts — PRD rule)    │
└─────────────┘    └────────────────────────────────────┘
       │
┌──────▼──────┐
│    Redis    │  Rate limiting, B2B aggregation cache
│  (optional) │  (Upstash — optional for MVP)
└─────────────┘

Hosting:
  Frontend  → Vercel (edge network, automatic deploys)
  API       → Railway or Render (Node container)
  DB + Auth → Supabase (PostgreSQL, magic links in v1.1)
  LLM       → Google AI (Gemini 2.0 Flash default)
```

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend framework | React 18 + Vite | Fast HMR, tree-shaking, PWA plugin |
| Styling | Tailwind CSS | Utility-first, no CSS runtime overhead |
| State | Zustand | Lightweight, no boilerplate |
| PWA | vite-plugin-pwa (Workbox) | Handles SW, manifest, precaching |
| Backend | Node.js + Express | Minimal, fast, easy to deploy |
| Database | Supabase (PostgreSQL) | Managed Postgres, RLS, realtime-ready |
| DB client | @supabase/supabase-js | Service role on API; anon key on web (v1.1) |
| Primary LLM | Google Gemini (`gemini-2.0-flash`) | Fast, cost-effective JSON generation |
| Fallback | Static recommendation cards | Same UI if Gemini call fails |
| Cache / rate | Redis (Upstash) or in-memory | Serverless Redis optional for MVP |
| Auth (v1.1) | Supabase Auth (magic link) | Built-in OTP/magic link, GDPR erasure hooks |
| Analytics | PostHog | Privacy-first, self-hostable for B2B |
| Hosting | Vercel + Railway | Zero-ops, auto SSL, branch previews |

---

## Project Structure

```
recharge/
├── apps/
│   ├── web/                        # React PWA
│   │   ├── public/
│   │   │   └── manifest.json
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── assessment/
│   │   │   │   │   ├── QuestionCard.jsx
│   │   │   │   │   ├── ProgressBar.jsx
│   │   │   │   │   └── OptionButton.jsx
│   │   │   │   ├── results/
│   │   │   │   │   ├── ScoreRing.jsx
│   │   │   │   │   ├── PersonalityCard.jsx
│   │   │   │   │   ├── TraitBars.jsx
│   │   │   │   │   └── RecommendationCard.jsx
│   │   │   │   └── shared/
│   │   │   │       ├── Button.jsx
│   │   │   │       └── LoadingDots.jsx
│   │   │   ├── screens/
│   │   │   │   ├── Hero.jsx
│   │   │   │   ├── BurnoutPhase.jsx
│   │   │   │   ├── PersonalityPhase.jsx
│   │   │   │   ├── Processing.jsx
│   │   │   │   └── Results.jsx
│   │   │   ├── engine/
│   │   │   │   ├── burnout.js        # scoring logic
│   │   │   │   ├── personality.js    # trait calculation
│   │   │   │   └── questions.js      # question data
│   │   │   ├── store/
│   │   │   │   └── assessment.js     # Zustand store
│   │   │   └── services/
│   │   │       └── api.js            # backend calls
│   │   └── vite.config.js
│   └── api/                          # Express server
│       ├── routes/
│       │   ├── assess.js
│       │   ├── auth.js
│       │   └── team.js
│       ├── services/
│       │   ├── llm.js                # AI abstraction layer
│       │   ├── scoring.js
│       │   └── email.js
│       ├── middleware/
│       │   └── rateLimit.js
│       └── lib/
│           └── supabase.js           # Supabase service-role client
├── supabase/
│   └── migrations/                   # SQL migrations (run in Supabase dashboard)
├── packages/
│   └── shared/                       # Shared types and constants
│       ├── questions.js
│       └── scoring.js
└── .env.example
```

---

## Scoring Engine

### Burnout Score

```javascript
// engine/burnout.js
// Each answer maps to 0–3 (0 = healthy, 3 = severe)
// Special case: Q12 is reverse-scored (asks about accomplishment)

const REVERSE_SCORED = [11]; // Q12 (index 11) — "sense of accomplishment"

export function scoreBurnout(answers) {
  const MAX = answers.length * 3;
  const raw = answers.reduce((sum, val, i) => {
    const score = REVERSE_SCORED.includes(i) ? 3 - val : val;
    return sum + score;
  }, 0);
  const pct = Math.round((raw / MAX) * 100);

  if (pct >= 70) return { pct, level: 'Severe Burnout',   cls: 'severe'   };
  if (pct >= 45) return { pct, level: 'Moderate Burnout', cls: 'moderate' };
  if (pct >= 25) return { pct, level: 'Mild Burnout',     cls: 'mild'     };
  return           { pct, level: 'Healthy Range',       cls: 'healthy'  };
}
```

### Personality Scoring

```javascript
// engine/personality.js
// Four personality types mapped from Q11 (index 10) — "what motivates you"
// 0 = Achiever, 1 = Creator, 2 = Connector, 3 = Anchor

const PERSONALITY_TYPES = [
  { id: 'achiever',  name: 'The Achiever',  icon: '🎯',
    desc: 'Driven by results and measurable progress.' },
  { id: 'creator',   name: 'The Creator',   icon: '🎨',
    desc: 'Energised by novelty and self-expression.' },
  { id: 'connector', name: 'The Connector', icon: '🤝',
    desc: 'Finds purpose through meaningful relationships.' },
  { id: 'anchor',    name: 'The Anchor',    icon: '🏛️',
    desc: 'Values stability, reliability, and structure.' },
];

// Four trait dimensions (each 0–100%)
const TRAIT_MAP = [
  { name: 'Introversion / Extraversion', questionIndices: [1, 8]  },
  { name: 'Planful / Spontaneous',        questionIndices: [0, 3]  },
  { name: 'Resilience',                   questionIndices: [4, 11] },
  { name: 'Stress Response',              questionIndices: [7, 9]  },
];

export function scorePersonality(answers) {
  const typeIndex = answers[10] ?? 0;
  const type = PERSONALITY_TYPES[typeIndex];
  const traits = TRAIT_MAP.map(t => {
    const vals = t.questionIndices.map(i => answers[i] ?? 0);
    const pct = Math.round((vals.reduce((a, v) => a + v, 0) / (vals.length * 3)) * 100);
    return { name: t.name, pct };
  });
  return { type, traits };
}
```

---

## AI Layer — Google Gemini

The AI layer is abstracted behind `generateRecommendations()`. Prompts contain **only**
burnout level and personality type — no PII (PRD privacy requirement).

```javascript
// apps/api/services/llm.js
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

export async function generateRecommendations(burnoutLevel, personalityType) {
  const prompt = buildPrompt(burnoutLevel, personalityType);
  try {
    const model = genAI.getGenerativeModel({
      model: MODEL,
      generationConfig: { responseMimeType: 'application/json' },
    });
    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(result.response.text());
    return Array.isArray(parsed) ? parsed : parsed.recommendations;
  } catch {
    return STATIC_FALLBACK[burnoutLevel] ?? STATIC_FALLBACK['Moderate Burnout'];
  }
}
```

**Model selection:**
- `gemini-2.0-flash` — default for MVP (fast, low cost, good JSON mode)
- `gemini-1.5-pro` — use if recommendation quality needs a boost at higher cost

---

## Database Schema (overview)

Schema lives in `supabase/migrations/`. Key tables:

```sql
-- Anonymous session (no account required)
sessions (id UUID PK, created_at, burnout_pct INT, burnout_level TEXT,
          personality_type TEXT, traits JSONB, recommendations JSONB,
          share_token TEXT UNIQUE)

-- Authenticated user (v1.1 — Supabase Auth manages auth.users; profile in public.profiles)
profiles (id UUID PK FK auth.users, email TEXT, created_at)

-- Links sessions to a user for history tracking
user_sessions (user_id UUID FK, session_id UUID FK, created_at)

-- B2B team workspace
teams (id UUID PK, name TEXT, slug TEXT UNIQUE, admin_user_id UUID FK,
       logo_url TEXT, created_at)

-- Team membership (anonymous by default)
team_sessions (team_id UUID FK, session_id UUID FK, joined_at)
-- NOTE: team_sessions never stores user_id — anonymisation by design
-- Aggregate queries use MIN(5) threshold before returning data
```

---

## API Endpoints

### POST /api/assess
Accepts burnout + personality answers, runs scoring, calls AI, returns full results.

```javascript
// Request
{
  "burnoutAnswers": [2, 1, 0, 3, 2, 1, 3, 0, 2, 2, 1, 0], // 12 ints, 0–3
  "personalityAnswers": [0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3],
  "teamToken": "optional-invite-token"
}

// Response
{
  "sessionId": "uuid",
  "shareToken": "abc123",
  "burnout": { "pct": 62, "level": "Moderate Burnout", "cls": "moderate" },
  "personality": {
    "type": { "id": "achiever", "name": "The Achiever", "icon": "🎯", "desc": "..." },
    "traits": [{ "name": "Resilience", "pct": 45 }, ...]
  },
  "recommendations": [
    { "icon": "🌿", "title": "Schedule recovery time", "tip": "Block 30 min daily..." },
    ...
  ]
}
```

### GET /api/session/:shareToken
Returns the public shareable result (burnout category + personality type, no raw score).

### POST /api/auth/magic
Sends a magic link email. Returns `{ sent: true }`.

### GET /api/history (authenticated)
Returns array of past sessions for the authenticated user.

### POST /api/team/create (authenticated)
Creates a B2B team workspace, returns invite URL.

### GET /api/team/:id/aggregate (authenticated admin)
Returns anonymised team stats. Returns `{ error: 'insufficient_data' }` if < 5 responses.

---

## PWA Configuration

```javascript
// vite.config.js (key PWA settings)
VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
  manifest: {
    name: 'Recharge',
    short_name: 'Recharge',
    description: 'Burnout & personality assessment',
    theme_color: '#2D6A4F',
    background_color: '#F7F4EF',
    display: 'standalone',
    start_url: '/',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
    runtimeCaching: [{
      urlPattern: /^https:\/\/api\.recharge\.app\//,
      handler: 'NetworkFirst',
      options: { cacheName: 'api-cache', networkTimeoutSeconds: 10 },
    }],
  },
})
```

---

## Environment Variables

```bash
# .env.example

# Supabase (required)
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # API server only — never expose to web bundle
SUPABASE_ANON_KEY=eyJ...             # web client (v1.1 auth)

# Google Gemini (required)
GEMINI_API_KEY=AIza...
GEMINI_MODEL=gemini-2.0-flash

# API server
PORT=3001
CORS_ORIGIN=http://localhost:5173
MAGIC_LINK_BASE_URL=https://recharge.app

# Optional
REDIS_URL=redis://...
POSTHOG_KEY=phc_...
RATE_LIMIT_WINDOW_MS=3600000
RATE_LIMIT_MAX=10
```

---

## Security Checklist

Before shipping MVP, verify all of the following:

- [ ] `GEMINI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are server-side only
- [ ] `/api/assess` rate limited (10/hour/IP via Redis or in-memory)
- [ ] Assessment answers are validated server-side (12 items, values 0–3)
- [ ] `shareToken` is random UUID — not guessable from session ID
- [ ] Team aggregate endpoint enforces `COUNT >= 5` before returning data
- [ ] Supabase Auth magic links use default expiry (configure in Supabase dashboard)
- [ ] CORS restricted to `recharge.app` origin in production
- [ ] `helmet()` middleware enabled on Express
- [ ] Supabase queries use explicit `.select()` columns — avoid over-fetching PII
- [ ] RLS enabled on all tables; service role used only in API server

---

## Common Development Tasks

**Add a new question to either phase:**
1. Edit `packages/shared/questions.js`
2. Update the answer array length in `engine/burnout.js` or `engine/personality.js`
3. Update `REVERSE_SCORED` indices if the new question is reverse-scored
4. Run `npm test` — scoring unit tests will catch index mismatches

**Change the AI model:**
Set `GEMINI_MODEL` in `.env` (e.g. `gemini-2.0-flash` or `gemini-1.5-pro`). No code changes needed.

**Deploy to production:**
See `references/deployment.md` for full Railway + Vercel setup with GitHub Actions CI.

**Add a new personality dimension:**
Add to `TRAIT_MAP` in `personality.js` with the question indices to average.
Update the results screen `TraitBars.jsx` — it maps the traits array dynamically.

**Implement share card:**
Use `html2canvas` to capture the results `<div>` as a PNG. The share card div ID
is `#share-card`. See `references/share-card.md` (v1.1 feature).

---

## Reference Files

| File | Contents | When to read |
|---|---|---|
| `supabase/migrations/` | SQL schema, RLS policies | DB work, B2B features |
| `references/deployment.md` | Vercel config, Railway setup, env vars, CI/CD | Deploy / infra tasks |
