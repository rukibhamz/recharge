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
| `VITE_APP_URL` | Yes in production — public web origin, e.g. `https://YOUR-PROJECT.vercel.app` (no trailing slash). Used for magic-link redirects. |

Do **not** put `SUPABASE_SERVICE_ROLE_KEY` or `GEMINI_API_KEY` on Vercel.

## Supabase Auth (magic link emails)

These settings live in the **Supabase dashboard**, not in app code. Wrong values cause “Supabase Auth” branding and redirects to `localhost`.

### 1. Fix localhost redirects

**Authentication → URL Configuration:**

| Setting | Value |
|---------|--------|
| **Site URL** | Your live app, e.g. `https://YOUR-PROJECT.vercel.app` (not localhost) |
| **Redirect URLs** | Add both production and local: `https://YOUR-PROJECT.vercel.app/auth/callback` and `http://localhost:5173/auth/callback` |

If the production callback URL is missing from **Redirect URLs**, Supabase ignores `emailRedirectTo` and sends users to **Site URL** — often still `http://localhost:5173`.

Also set `VITE_APP_URL` on Vercel to the same live origin, then **redeploy** (Vite bakes env at build time).

### 2. Rebrand the email (stop “Supabase Auth”)

**Authentication → Emails** (or **Email Templates**):

1. **Sender / from name** — set to `Recharge` (not “Supabase Auth”). With custom SMTP you can also set `noreply@yourdomain.com`.
2. Open the **Magic Link** template and replace subject/body, for example:

**Subject:** `Sign in to Recharge`

**Body (HTML):**

```html
<h2>Sign in to Recharge</h2>
<p>Click the link below to sign in. This link expires shortly and can only be used once.</p>
<p><a href="{{ .ConfirmationURL }}">Sign in to Recharge</a></p>
<p>If you didn’t request this, you can ignore this email.</p>
```

Optional: customize **Confirm signup** / **Invite** templates the same way.

## `Cannot GET /`

- On **Vercel**: build failed or wrong output directory — fix build first.
- On **API host**: normal for `/` — use `/health`.
