# Recharge

Burnout & personality assessment PWA with AI-powered, day-by-day recovery plans and an in-app wellbeing companion (Oma).

**Stack:** React (Vite) · Express · Supabase · Google Gemini (plus configurable LLM connectors)

**Design system:** See [`DESIGN.md`](DESIGN.md) — Fraunces + Public Sans + IBM Plex Mono, canopy green on warm linen.

## Features

### Assessment
- **Two-phase interview** — personality (Big Five / OCEAN) then burnout check-in (~10 minutes)
- **Context-aware questions** — shaped by name, location, age band, work setting, and recovery preferences
- **Deterministic scoring** — burnout dimensions + OCEAN traits; LLM polishes copy, not scores
- **Psychometric profile** — archetype, core conflict, trait accelerators/buffers, actionable protocol rules
- **Progress saved locally** — unfinished assessments resume on the same device (TTL applies)

### Results & recovery
- **Energy portrait** — score ring, structured burnout narrative, trait bars, moodboard
- **Day-by-day recovery roadmap** — horizon by severity (3 / 7 / 14 / 21 days); Today / Upcoming / Done with local check-offs
- **Guest teaser** — Day 1 free; sign in to unlock the full plan and save history
- **Email results** — send a summary to your inbox with optional newsletter opt-in
- **Share card + public link** — downloadable image and time-limited share URL
- **Stable URLs** — `/assess/*` during the interview and `/results` when finished (refresh-safe)

### Account & coach
- **Magic-link auth** — no password; save results and revisit history
- **Oma** — private AI wellbeing companion grounded in your check-ins and **today’s** recovery checklist (not therapy or crisis care)
- **Coach chat archive** — idle threads archive; earlier chats stay available

### Admin & platform
- **Admin dashboard** — health, analytics, AI monitoring, feedback inbox
- **Funnel analytics** — client events (optional PostHog via `VITE_POSTHOG_KEY`)
- **Newsletter** — collect opt-ins from results email; compose and send from admin
- **SMTP settings** — configure outbound mail in Admin → Settings → Email (env fallback supported)
- **LLM connectors** — Gemini and other providers; usage monitoring
- **Knowledge bank** — learned patterns feed questions, advice, and coach context
- **User feedback** — public `/feedback` form + admin inbox
- **White-label workspaces** — B2B brand, domain, and landing content (SaaS)

### Product surfaces
- Landing, About, FAQ, Privacy, Terms, Security
- Installable **PWA** (manifest + service worker)
- Not a medical diagnosis — self-reflection only

## Prerequisites

- Node.js 20+
- Supabase project ([supabase.com](https://supabase.com))
- Google AI API key ([aistudio.google.com](https://aistudio.google.com)) — or another connector configured in admin
- SMTP credentials (for results email and newsletters)

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   Copy `.env.example` to `.env` in the project root and fill in your keys.

3. **Run Supabase migrations**

   Prefer `npm run db:migrate` when `DATABASE_URL` is set, or run the SQL files in order in the Supabase SQL editor:

   - `001`–`010` — core sessions, banks, auth, demographics, snapshots
   - `011` — SaaS workspaces
   - `012`–`014` — LLM connectors + usage logs
   - `015`–`016` — coach chat + coach settings
   - `017`–`018` — AI knowledge bank + user feedback
   - `019` — OCEAN personality bank
   - `020` — newsletter subscribers, email send log, SMTP settings slot

4. **Enable Supabase Auth (for saved results, Oma, admin)**

   In the Supabase dashboard:
   - **Authentication → Providers → Email**: enable magic link / OTP
   - **Authentication → URL configuration**:
     - **Site URL** = production app URL (e.g. `https://YOUR-PROJECT.vercel.app`) — not localhost in prod
     - **Redirect URLs** = `https://YOUR-PROJECT.vercel.app/auth/callback` and `http://localhost:5173/auth/callback`
   - **Authentication → Emails**: set sender name to **Recharge** and edit the Magic Link template (see `docs/DEPLOY_VERCEL.md`)
   - Copy the **anon key** into `.env` as `VITE_SUPABASE_ANON_KEY` (and `SUPABASE_ANON_KEY` if needed)
   - On Vercel, set `VITE_APP_URL` to your live web origin (no trailing slash)
   - Set `ADMIN_EMAILS` on the API host for `/admin` access

5. **Configure SMTP (results + newsletters)**

   After deploy: **Admin → Settings → Email / SMTP**, save host/credentials, send a test.
   Optional env fallbacks: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM_EMAIL` (see `.env.example`).

6. **Start development**

   ```bash
   npm run dev
   ```

   - Web: http://localhost:5173
   - API: http://localhost:3001

## Project structure

```
recharge/
├── apps/web/          React PWA
├── apps/api/          Express API (LLM + Supabase + email)
├── packages/shared/   Scoring, questions, roadmap, prompts
└── supabase/          SQL migrations
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start web + API concurrently |
| `npm run dev:web` | Web only |
| `npm run dev:api` | API only |
| `npm run build` | Production web build |
| `npm start` | Production API server |
| `npm test` | Shared package unit tests |
| `npm run db:migrate` | Apply Supabase SQL migrations (needs `DATABASE_URL`) |

Deploy: [Vercel (web)](docs/DEPLOY_VERCEL.md) · [Render / Railway (API)](docs/DEPLOY_API.md)

## Privacy

LLM prompts use burnout and personality context — not email or full identity. API keys and the Supabase service role key stay server-side only. Newsletter mail is opt-in only. See `/privacy` in the app for the full policy.
