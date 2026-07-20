# Why Vercel keeps failing (and how to fix it)

**Yes — Vercel should only host the frontend** (`apps/web`).  
**The API** (`apps/api`) belongs on **Render or Railway**, not Vercel.

---

## The real issue

Your build log says:

```text
npm error location /vercel/path0/apps/api
npm error workspace @recharge/api@1.0.0
```

That means Vercel’s **Root Directory** is set to **`apps/api`**, not the React app.

From that folder:

- There is no frontend build
- Scripts like `vercel-build` live in the **repo root** `package.json`, not in `apps/api`
- npm runs commands as the **`@recharge/api`** workspace → errors

This is a **Vercel project setting**, not a bug in React.

---

## Fix (2 minutes)

1. Open [Vercel Dashboard](https://vercel.com) → your **Recharge** project  
2. **Settings** → **General** → **Root Directory**  
3. Click **Edit**  
4. Choose one:

   | Option | Root Directory |
   |--------|----------------|
   | **Recommended** | Leave **empty** (repository root) |
   | Alternative | `apps/web` |

5. **Do not** use `apps/api`  
6. **Settings** → **Build & Deployment** — confirm (or override):

   **If Root Directory is empty (repo root):**

   | Field | Value |
   |-------|--------|
   | Install Command | `npm install` |
   | Build Command | `npm run build -w @recharge/web` |
   | Output Directory | `apps/web/dist` |

   **If Root Directory is `apps/web`:**

   | Field | Value |
   |-------|--------|
   | Install Command | `cd ../.. && npm install` |
   | Build Command | `cd ../.. && npm run build -w @recharge/web` |
   | Output Directory | `dist` |

7. **Redeploy** (Deployments → … → Redeploy)

8. Push latest code so root `vercel.json` / `apps/web/vercel.json` apply.

---

## Two deployments (normal setup)

```text
┌─────────────────────┐     VITE_API_URL      ┌─────────────────────┐
│  Vercel             │ ───────────────────►  │  Render / Railway   │
│  apps/web (static)  │                     │  apps/api (Express) │
└─────────────────────┘                     └─────────────────────┘
```

| Host | What | Start command |
|------|------|----------------|
| **Vercel** | PWA / React | `npm run build -w @recharge/web` |
| **Render/Railway** | API + Gemini + Supabase | `npm start` (see `render.yaml`) |

---

## If you have two Vercel projects

Sometimes the monorepo creates **two** projects (`web` + `api`).  
**Delete or ignore** the one pointing at `apps/api`.  
Keep only the frontend project with Root Directory = root or `apps/web`.

---

## Env vars on Vercel (frontend only)

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL` → your Render/Railway URL (e.g. `https://recharge-api.onrender.com`)

Never put `GEMINI_API_KEY` or `SUPABASE_SERVICE_ROLE_KEY` on Vercel.

---

## After it works

- Open your Vercel URL → landing page loads  
- `https://your-api.onrender.com/health` → JSON `status: ok`  
- Complete an assessment in prod → API must be reachable via `VITE_API_URL`
