# Recharge

Burnout & personality assessment PWA with AI-powered recovery recommendations.

**Stack:** React (Vite) · Express · Supabase · Google Gemini

**Design system:** See [`DESIGN.md`](DESIGN.md) — Outfit + Inter, Recharge Blue (`#003441`), warm background (`#FAF9F6`).

## Prerequisites

- Node.js 20+
- Supabase project ([supabase.com](https://supabase.com))
- Google AI API key ([aistudio.google.com](https://aistudio.google.com))

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   Copy `.env.example` to `.env` in the project root and fill in your keys.

3. **Run Supabase migrations**

   Open the Supabase SQL editor and run, in order:
   - `supabase/migrations/001_initial.sql`
   - `supabase/migrations/002_add_display_name.sql`
   - `supabase/migrations/003_question_bank.sql` (legacy — optional)
   - `supabase/migrations/004_burnout_question_bank.sql` (burnout bank — 6 dimensions, 60 questions)
   - `supabase/migrations/005_personality_mbti_question_bank.sql` (MBTI personality — 4 dichotomies, 120 questions, 16 types)
   - `supabase/migrations/006_auth_profiles_rls.sql` (auth profiles + RLS)
   - `supabase/migrations/007_session_demographics.sql` (country / age / work profile on sessions)

4. **Enable Supabase Auth (optional — for saved results)**

   In the Supabase dashboard:
   - **Authentication → Providers → Email**: enable magic link / OTP
   - **Authentication → URL configuration**:
     - **Site URL** = production app URL (e.g. `https://YOUR-PROJECT.vercel.app`) — not localhost in prod
     - **Redirect URLs** = `https://YOUR-PROJECT.vercel.app/auth/callback` and `http://localhost:5173/auth/callback`
   - **Authentication → Emails**: set sender name to **Recharge** and edit the Magic Link template (see `docs/DEPLOY_VERCEL.md`)
   - Copy the **anon key** into `.env` as `VITE_SUPABASE_ANON_KEY` (and `SUPABASE_ANON_KEY` if needed)
   - On Vercel, set `VITE_APP_URL` to your live web origin (no trailing slash)

5. **Start development**

   ```bash
   npm run dev
   ```

   - Web: http://localhost:5173
   - API: http://localhost:3001

## Project structure

```
recharge/
├── apps/web/          React PWA
├── apps/api/          Express API (Gemini + Supabase)
├── packages/shared/   Questions + scoring engine
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
| `npm test` | Scoring unit tests |
| `npm run db:migrate` | Apply Supabase SQL migrations (needs `DATABASE_URL`) |

Deploy: [Vercel (web)](docs/DEPLOY_VERCEL.md) · [Render / Railway (API)](docs/DEPLOY_API.md)

## Phase 1 (MVP) status

- [x] Monorepo scaffold
- [x] 24-question assessment flow
- [x] Scoring engine
- [x] Results screen
- [x] Gemini recommendations + static fallback
- [x] Supabase session persistence
- [x] PWA manifest + service worker
- [x] Name capture + personalized question flow
- [x] Share cards + public share links (v1.1)
- [x] Supabase Auth + history (magic link, saved results)
- [ ] B2B dashboard (v1.1)

## Privacy

Gemini prompts contain only burnout level and personality type — no PII. API keys and the Supabase service role key must stay server-side only.
