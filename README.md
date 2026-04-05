# Vitara Health Companion

A personal health management app built with **Expo Router** (frontend) and **Express + tRPC** (backend).

---

## Architecture Overview

```
┌──────────────────────────────────────────┐
│  Vercel  (static web frontend)           │
│  Expo Router → exported as static HTML   │
│  Build output: web-dist/                 │
└────────────────────┬─────────────────────┘
                     │  HTTPS (tRPC + REST)
                     ▼
┌──────────────────────────────────────────┐
│  Railway  (long-running Node service)    │
│  Express + tRPC server  (dist/index.js)  │
│  PORT provided by Railway at runtime     │
└────────────────────┬─────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────┐
│  External managed MySQL database         │
│  (PlanetScale, Railway MySQL, etc.)      │
│  Connected via DATABASE_URL              │
└──────────────────────────────────────────┘
```

- **Frontend** – Expo Router with `web.output: "static"`. Exported as a static SPA by `pnpm build:web` and deployed to Vercel.
- **Backend** – Express + tRPC, compiled with esbuild and deployed as a long-running Node service on Railway.
- **OAuth** – The OAuth web callback (`/api/oauth/callback`) lives on the backend (Railway). After a successful login the backend redirects the browser to the Vercel frontend URL.
- **Database** – Any managed MySQL-compatible database; connection configured via `DATABASE_URL`.

---

## Local Development

### Prerequisites

- Node ≥ 20
- pnpm 9 (`npm install -g pnpm@9`)

### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Copy and fill in environment variables
cp .env.example .env
# Edit .env – at minimum set DATABASE_URL, JWT_SECRET, OAUTH_SERVER_URL, VITE_APP_ID

# 3. Run database migrations
pnpm db:push

# 4. Start both servers concurrently (Metro on :8081, API on :3000)
pnpm dev
```

The Expo web app is available at `http://localhost:8081`.  
The API server is available at `http://localhost:3000`.

### Useful development commands

| Command | Description |
|---|---|
| `pnpm dev` | Start Metro + API server concurrently |
| `pnpm dev:server` | API server only (hot-reload via tsx) |
| `pnpm dev:metro` | Expo Metro bundler only |
| `pnpm check` | TypeScript type-check |
| `pnpm lint` | ESLint |
| `pnpm test` | Run Vitest unit tests |
| `pnpm db:push` | Generate & run Drizzle migrations |

---

## Vercel – Frontend Deployment

### One-time project setup

1. Import this repository in the [Vercel dashboard](https://vercel.com/new).
2. Set the following in **Settings → Build & Development Settings** (these are already configured in `vercel.json` so you can leave them as-is):
   - **Build Command:** `pnpm build:web`
   - **Output Directory:** `web-dist`
   - **Framework Preset:** Other
3. Add the environment variables below in **Settings → Environment Variables**.

### Required Vercel environment variables

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | **Required.** Full HTTPS URL of the Railway backend (e.g. `https://health-companion-api.up.railway.app`). No trailing slash. |
| `EXPO_PUBLIC_OAUTH_PORTAL_URL` | Manus OAuth portal URL (e.g. `https://portal.manus.space`) |
| `EXPO_PUBLIC_OAUTH_SERVER_URL` | Manus OAuth server URL |
| `EXPO_PUBLIC_APP_ID` | OAuth application ID (same value as `VITE_APP_ID` on the backend) |
| `EXPO_PUBLIC_OWNER_OPEN_ID` | Open ID of the project owner |
| `EXPO_PUBLIC_OWNER_NAME` | Display name of the project owner |

> **Note:** Variables prefixed `EXPO_PUBLIC_` are inlined into the browser bundle at build time. Do **not** put secrets here.

### Manual build

```bash
pnpm build:web   # outputs to web-dist/
```

---

## Railway – Backend Deployment

### One-time service setup

1. Create a new **Railway** project and add a **GitHub** service pointing to this repo.
2. Set the **Start Command** to `pnpm start:server`.
3. Set the **Build Command** to `pnpm build:server` (or let Railway auto-detect it from `package.json`).
4. Railway automatically injects `PORT` at runtime – the server reads it directly.
5. Add the environment variables below in **Variables**.

### Required Railway environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | **Required.** MySQL connection string (`mysql://user:pass@host:3306/db`) |
| `JWT_SECRET` | **Required.** Secret for signing session JWTs. Use a long random string. |
| `OAUTH_SERVER_URL` | **Required.** Manus OAuth server URL |
| `VITE_APP_ID` | **Required.** OAuth application ID |
| `FRONTEND_URL` | **Required.** Public URL of the Vercel frontend. Used for OAuth web callback redirect. |
| `OWNER_OPEN_ID` | Open ID of the project owner |
| `BUILT_IN_FORGE_API_URL` | (Optional) Manus Forge API base URL for LLM/image features |
| `BUILT_IN_FORGE_API_KEY` | (Optional) Manus Forge API key |
| `NODE_ENV` | Set to `production` |

### Manual build & start

```bash
pnpm build:server   # compiles server/_core/index.ts → dist/index.js
pnpm start:server   # NODE_ENV=production node dist/index.js
```

### Health check

Railway can use `/api/health` as the health check endpoint:

```
GET https://<your-backend>.up.railway.app/api/health
→ { "ok": true, "timestamp": 1712345678901 }
```

---

## OAuth Callback Setup

The OAuth **web** flow redirects to the **backend** callback URL after authentication:

```
https://<backend>.up.railway.app/api/oauth/callback
```

Register this URL as an allowed redirect URI in your Manus OAuth application settings. After a successful login the backend sets an HTTP-only session cookie and redirects the browser to `FRONTEND_URL`.

The OAuth **mobile** flow (iOS/Android) uses a deep link scheme derived from the bundle ID:

```
manus20260308231022://oauth/callback
```

This is handled natively by `expo-linking` and does not require backend registration.

---

## Database Migrations

This project uses [Drizzle ORM](https://orm.drizzle.team/) with a MySQL-compatible database.

```bash
# Generate a new migration from schema changes and apply it
pnpm db:push
```

Migration files live in `drizzle/migrations/`. The initial schema is in `drizzle/0000_elite_eternals.sql`.

When deploying a new version that includes schema changes, run `pnpm db:push` against the production `DATABASE_URL` before or as part of the deployment.

---

## Environment Variables Reference

See [`.env.example`](.env.example) for a fully annotated list of all variables, which service they belong to, and example values.

---

## Notes & Open Questions

- **CORS in production:** The backend reflects the request `Origin` header in `Access-Control-Allow-Origin`. Ensure the Vercel domain is in the request origin and that `sameSite: "none"` cookies work correctly across origins (requires HTTPS on both ends).
- **Cookie domain:** The `getSessionCookieOptions` helper sets a parent-domain cookie when both services share a common parent domain. In a Vercel + Railway split deployment they will be on different domains, so the cookie is effectively scoped to the Railway domain only. The frontend reads the session token from the cookie when making API requests via the tRPC client.
- **Jekyll GitHub Pages workflow** (`.github/workflows/jekyll-gh-pages.yml`): This workflow is a leftover placeholder and is not used by the current deployment strategy. It can be deleted once Vercel is confirmed as the frontend host.
