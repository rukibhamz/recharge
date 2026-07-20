# Deploy frontend on Vercel

The **Express API does not run on Vercel**. Deploy `apps/api` on [Render or Railway](DEPLOY_API.md) and set `VITE_API_URL` on Vercel.

## Vercel settings (pick one)

### Option A — Repo root (recommended)

| Setting | Value |
|---------|--------|
| Root Directory | *(empty)* |
| Install Command | `npm install` |
| Build Command | `npm run build -w @recharge/web` |
| Output Directory | `apps/web/dist` |

Root `vercel.json` sets this automatically after you push.

### Option B — `apps/web` as root

| Setting | Value |
|---------|--------|
| Root Directory | `apps/web` |
| Install Command | `cd ../.. && npm install` |
| Build Command | `cd ../.. && npm run build -w @recharge/web` |
| Output Directory | `dist` |

**Never** set Root Directory to `apps/api`.

---

## Common errors

### `Missing script: "build"` in `@recharge/api`

Root Directory is `apps/api`. Use Option A or B above.

### `vite: command not found` / `ERR_MODULE_NOT_FOUND`

1. **Install must run at monorepo root** (`npm install` from repo root, or `cd ../.. && npm install` when root is `apps/web`).
2. **Build command** must be `npm run build -w @recharge/web` (from repo root), not a bare `vite` in `apps/web` alone.
3. Commit `.npmrc` (`include=dev`).
4. Optional env: `NPM_CONFIG_INCLUDE` = `dev`.

The web app build runs: `node ../../node_modules/vite/bin/vite.js build` so Vite is found after a root install.

---

## Environment variables (Vercel)

| Variable | Required |
|----------|----------|
| `VITE_SUPABASE_URL` | Yes |
| `VITE_SUPABASE_ANON_KEY` | Yes |
| `VITE_API_URL` | Yes — your Render/Railway API URL |

Do **not** put `SUPABASE_SERVICE_ROLE_KEY` or `GEMINI_API_KEY` on Vercel.

## Supabase Auth

Add redirect URL: `https://YOUR-PROJECT.vercel.app/auth/callback`

## `Cannot GET /`

- On **Vercel**: build failed or wrong output directory — fix build first.
- On **API host**: normal for `/` — use `/health`.
