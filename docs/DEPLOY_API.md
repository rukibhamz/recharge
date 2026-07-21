# Deploy the Recharge API (Render & Railway)

The **Express API** (`apps/api`) runs here. The **React app** stays on **Vercel**.

Monorepo: deploy from the **repository root** (not `apps/api` alone), so `@recharge/shared` installs correctly.

---

## Required environment variables (API)

Set these in Render or Railway (not on Vercel):

| Variable | Required | Notes |
|----------|----------|--------|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server only — never expose to browser |
| `GEMINI_API_KEY` | Yes* | *Or use another provider in chain |
| `LLM_PROVIDER_ORDER` | Yes | e.g. `gemini` (drop `ollama` in cloud — no local Ollama) |
| `CORS_ORIGIN` | Yes | Your Vercel URL, e.g. `https://recharge.vercel.app` (no trailing slash) |
| `CORS_VERCEL_PREVIEWS` | Optional | Set `1` to allow any `https://*.vercel.app` preview URL |
| `ADMIN_EMAILS` | Optional | Comma-separated emails allowed to open `/admin` stats (API-only) |

### Business SaaS (white-label)

1. Run migration `011_saas_workspaces.sql` in Supabase.
2. Open `/admin` → **Business SaaS** → add a workspace (slug, domain, content, brand colour).
3. In **Vercel → Domains**, add the client hostname and configure DNS.
4. Set workspace status to **Active**.
5. Visiting that domain loads branding via `GET /api/tenant/resolve`.

### AI connectors (admin)

1. Run migration `012_llm_connectors.sql` in Supabase.
2. Open `/admin` → **AI connectors**.
3. Add Gemini, OpenAI, Anthropic, OpenRouter, and/or Ollama with model + API key.
4. Set **priority** (lower = tried first). Use **Test** to verify.
5. If no DB connectors exist, the API still uses `GEMINI_API_KEY` / Ollama env vars.

### AI monitoring

1. Run migration `013_llm_usage_logs.sql` in Supabase.
2. Open `/admin` → **AI monitoring**.
3. View per-model calls, success rate (uptime), latency (24h / 7d + live process).
4. Use **Probe all models** to run a live health check against every enabled connector.

| `PORT` | Auto | Render/Railway set `PORT` — app reads `process.env.PORT` |
| `GEMINI_MODEL` | Optional | Default in code: `gemini-2.5-flash-lite` |
| `RATE_LIMIT_MAX` | Optional | Default `10` per window |
| `RATE_LIMIT_WINDOW_MS` | Optional | Default 1 hour |

**Do not set** `OLLAMA_*` on cloud unless you run Ollama on the same private network (unusual).

**Production LLM tip:**

```env
LLM_PROVIDER_ORDER=gemini
```

---

## After the API is live

1. Open `https://YOUR-API-URL/health` — expect `"status":"ok"` and `supabase.connected: true`.
2. On **Vercel**, set `VITE_API_URL=https://YOUR-API-URL` (no trailing slash).
3. In **Supabase → Authentication → URL configuration**, add:
   - `https://YOUR-VERCEL-APP.vercel.app/auth/callback`

---

# Render

## Option 1 — Blueprint (`render.yaml` in repo)

1. Push this repo to GitHub.
2. [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**.
3. Connect the repo — Render reads `render.yaml`.
4. Add **secret** env vars in the dashboard (Supabase, Gemini, `CORS_ORIGIN`) — the blueprint only sets `NODE_VERSION`.
5. Deploy.

## Option 2 — Manual Web Service

1. **New** → **Web Service** → connect GitHub repo.
2. **Settings:**

   | Field | Value |
   |-------|--------|
   | **Root Directory** | *(leave empty — repo root)* |
   | **Runtime** | Node |
   | **Build Command** | `npm install` |
   | **Start Command** | `npm start` |
   | **Health Check Path** | `/health` |

3. **Environment** → add variables from the table above.
4. **Instance type**: Free tier works for testing; assessments are LLM-heavy — Starter+ recommended.
5. Create service → copy public URL (e.g. `https://recharge-api.onrender.com`).

### Render notes

- Free services **spin down** after inactivity — first request may be slow (~30–60s).
- Set `CORS_ORIGIN` to your exact Vercel domain (comma-separate multiple: `https://app.vercel.app,https://app-git-main.vercel.app`).
- Logs: service → **Logs** — watch for `Supabase insert error` or Gemini errors.

---

# Railway

## Deploy from GitHub

1. [Railway](https://railway.app) → **New Project** → **Deploy from GitHub repo**.
2. Select the **recharge** repository.

### Service settings

1. Open the service → **Settings**:

   | Field | Value |
   |-------|--------|
   | **Root Directory** | `/` (repo root) |
   | **Build Command** | `npm install` |
   | **Start Command** | `npm start` |
   | **Watch Paths** | optional: `apps/api/**`, `packages/shared/**` |

2. **Variables** tab → add all required env vars (same table as above).

3. **Networking** → **Generate Domain** → you get something like `https://recharge-api-production.up.railway.app`.

4. Optional: **Healthcheck** path `/health` (Railway settings → Deploy).

### Railway notes

- Railway injects `PORT` automatically — no need to hardcode.
- Use the **public HTTPS URL** for `VITE_API_URL` on Vercel.
- If build fails with workspace errors, confirm **Root Directory** is repo root, not `apps/api`.

---

# Verify end-to-end

```bash
# API health
curl https://YOUR-API-URL/health

# CORS (replace with your Vercel origin)
curl -H "Origin: https://YOUR-VERCEL-APP.vercel.app" \
  -I https://YOUR-API-URL/health
```

In the browser:

1. Open your Vercel app.
2. DevTools → **Network** → start assessment → requests should go to `VITE_API_URL/api/...`, not `localhost`.

---

# Architecture summary

```text
User → Vercel (apps/web)
         │  VITE_API_URL
         ▼
       Render or Railway (npm start → apps/api)
         │  SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY
         ▼
       Supabase + Google Gemini
```

---

# Gemini quota & rate limits

Each full assessment can use **up to ~5 Gemini calls** (personality test, personality score, burnout test, burnout score, recommendations). On Render there is **no Ollama** — only Gemini + fallbacks.

### 1. Tune Gemini (keep AI when possible)

Set on **Render**:

| Variable | Suggested | Purpose |
|----------|-----------|---------|
| `GEMINI_MODEL` | `gemini-2.5-flash-lite` | Cheapest / highest free RPM |
| `GEMINI_MIN_INTERVAL_MS` | `6000`–`8000` | Space out calls (global queue) |
| `GEMINI_MAX_RETRIES` | `2` | Retries on 429 with backoff |
| `GEMINI_CIRCUIT_BREAKER_MS` | `120000` | Pause Gemini after all models fail |
| `RATE_LIMIT_MAX` | `5`–`10` | Limit assessments per IP per hour |

Check status: `GET /health` → `llm.gemini.quotaErrors`, `circuitOpen`, `questionBank.ready`.

**Google side:** enable billing or raise quota in [Google AI Studio](https://aistudio.google.com/) / Cloud console if you hit daily caps.

### 2. Automatic fallbacks (default — push latest API code)

`LLM_ASSESSMENT_BANK_FALLBACK=true` (default):

- LLM fails → **Supabase question bank** for tests (or static JSON if DB empty)
- Score fails → **MBTI math + type profiles** / **burnout scoring**
- Recommendations already fall back to **static tips** per level

Ensure Supabase question tables are seeded (`/health` → `questionBank.ready: true`).

### 3. Bank-only mode (no Gemini for questions)

Zero question/score LLM calls — still uses static recommendations unless you leave recommendations on:

```env
LLM_PERSONALITY_QUESTIONS=false
LLM_BURNOUT_QUESTIONS=false
LLM_RECOMMENDATIONS=false
```

Optional: keep `LLM_RECOMMENDATIONS=true` for **one** Gemini call at the end only (still has static fallback).

### 4. Local dev with Ollama

```env
LLM_PROVIDER_ORDER=gemini,ollama
OLLAMA_BASE_URL=http://localhost:11434
```

When Gemini hits 429, the chain tries Ollama automatically.

---

# Troubleshooting

| Problem | Fix |
|---------|-----|
| API 502 / crash on start | Check logs; ensure `SUPABASE_URL` and keys set; `npm start` runs from **repo root** |
| CORS error in browser | `CORS_ORIGIN` must match Vercel URL exactly (scheme + host, no path) |
| Assessment hangs | Render free tier cold start; or Gemini rate limits — check API logs |
| Gemini 429 / quota | See [Gemini quota & rate limits](#gemini-quota--rate-limits); raise limits or use bank fallbacks |
| `Cannot GET /` on API URL | Normal for `/` — use `/health` |
| Vercel still calls localhost | Redeploy Vercel after setting `VITE_API_URL` (Vite bakes env at **build** time) |

---

# Local vs production

| | Local | Cloud API |
|--|--------|-----------|
| Web | `npm run dev` (:5173) | Vercel |
| API | `npm run dev` (:3001) | Render / Railway |
| Env file | `.env` at repo root | Platform **Variables** only |
| Ollama | Optional fallback | Use `LLM_PROVIDER_ORDER=gemini` |
