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
| `CORS_ORIGIN` | Yes | Your Vercel URL, e.g. `https://recharge.vercel.app` |
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

# Troubleshooting

| Problem | Fix |
|---------|-----|
| API 502 / crash on start | Check logs; ensure `SUPABASE_URL` and keys set; `npm start` runs from **repo root** |
| CORS error in browser | `CORS_ORIGIN` must match Vercel URL exactly (scheme + host, no path) |
| Assessment hangs | Render free tier cold start; or Gemini rate limits — check API logs |
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
