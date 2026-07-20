# MVP implementation plan

Track launch progress. Update checkboxes as you complete each item.

## Phase 0 — Validate locally

- [ ] `GET /health` → `supabase.connected` and `demographicsColumn: true`
- [ ] Full assessment → row in `sessions`, no cloud warning on results
- [ ] Magic link from results → row in `user_sessions`
- [ ] `/account` lists saved assessment
- [ ] `/history/:id` opens saved result

## Phase 1 — Production deploy

### API (Railway / Render)

- [ ] Deploy repo; start command: `npm start` (runs `@recharge/api`)
- [ ] Env: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `LLM_*`, `PORT`
- [ ] Env: `CORS_ORIGIN=https://your-app.vercel.app` (comma-separate for preview URLs)
- [ ] Health check URL responds

### Vercel (web)

- [ ] `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`
- [ ] Production smoke: assess → save → account

### Supabase Auth

- [ ] Redirect: `https://your-app.vercel.app/auth/callback`
- [ ] Site URL set to production domain

## Phase 2 — Security

- [ ] Service role key only on API host
- [ ] CORS not `*` in production
- [ ] Rate limits reviewed (`RATE_LIMIT_MAX`)

## Phase 3 — Polish (in repo)

- [x] Legal pages `/privacy`, `/terms`, `/security`
- [x] Account data export `GET /api/account/export`
- [x] Account delete `DELETE /api/account`
- [x] Post-login redirect to saved result after magic link
- [ ] Hero About/FAQ content (optional)

## Phase 4 — v1.1 B2B

- [ ] Team create / invite API
- [ ] Team dashboard UI
- [ ] Aggregate endpoint (min 5 responses)

---

## Quick commands

```bash
npm run dev          # local web + API
npm run build        # production web build
npm start            # production API
npm run db:migrate   # all SQL migrations (needs DATABASE_URL)
```
