# Deploy frontend on Vercel

The **Express API does not run on Vercel**. Deploy `apps/api` on Render/Railway and set `VITE_API_URL` on Vercel.

## Fix: `Missing script: "build"` in `@recharge/api`

This happens when Vercel **Root Directory** is set to `apps/api`. The API has no static build.

In Vercel → **Project Settings → General → Root Directory**:

| Setting | Value |
|---------|--------|
| Root Directory | **empty** (repo root) **or** `apps/web` |
| **Not** | `apps/api` |

Then redeploy.

## Recommended: repo root

Use the root `vercel.json`:

- **Install:** `npm install`
- **Build:** `npm run build -w @recharge/web`
- **Output:** `apps/web/dist`

## Alternative: `apps/web` as root

Use `apps/web/vercel.json` (install runs from monorepo root).

## Environment variables (Vercel)

| Variable | Required |
|----------|----------|
| `VITE_SUPABASE_URL` | Yes |
| `VITE_SUPABASE_ANON_KEY` | Yes |
| `VITE_API_URL` | Yes — e.g. `https://recharge-api.onrender.com` |

Do **not** put `SUPABASE_SERVICE_ROLE_KEY` or `GEMINI_API_KEY` on Vercel (frontend only).

## Supabase Auth

Add redirect URL: `https://YOUR-PROJECT.vercel.app/auth/callback`

## `Cannot GET /`

- On **Vercel:** should serve `index.html` via rewrites — if you see this, build failed or wrong output directory.
- If you opened your **API** URL in the browser without `/health`, Express returns `Cannot GET /` — that is normal; use `/health` or deploy the web app on Vercel separately.
