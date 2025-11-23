# India MF Data PWA Monorepo

This Turborepo hosts the open-source India Mutual Funds Data platform. Current work focuses on the Express + Prisma backend (`apps/api`) while the PWA shell is scaffolded in `apps/web`.

> The stock `create-turbo` scaffold is being reshaped into the architecture described in `Quick-Start-Guide.md`. This README documents the backend setup that now exists.

## Prerequisites

- Node.js 20+
- npm 10+ (workspace aware)
- Access to the Render PostgreSQL instance (credentials below)

## Environment Variables

Copy `.env.example` to `.env` in the repo root and fill in actual secrets:

```bash
cp .env.example .env
```

| Key | Description |
| --- | ----------- |
| `PORT` | API port, defaults to `3001` |
| `DATABASE_URL` | Render Postgres connection string (internal URL in production) |
| `MFAPI_BASE_URL` | Optional override for MFapi.in (defaults to `https://api.mfapi.in/mf`) |
| `REDIS_URL` | Reserved for the future caching layer |
| `APP_VERSION` | Optional build metadata |

Render provided credentials (keep private):

```
Hostname: dpg-d4hcdr7diees73bf2qmg-a
Port: 5432
Database: imfd_pg_db
Username: ianpinto_admin
Password: Y02GfxJ3pf7JmMW3G0zBmVsMVn8t0kJy
Internal URL: postgresql://ianpinto_admin:Y02GfxJ3pf7JmMW3G0zBmVsMVn8t0kJy@dpg-d4hcdr7diees73bf2qmg-a/imfd_pg_db
External URL: postgresql://ianpinto_admin:Y02GfxJ3pf7JmMW3G0zBmVsMVn8t0kJy@dpg-d4hcdr7diees73bf2qmg-a.oregon-postgres.render.com/imfd_pg_db
```

Set `DATABASE_URL` to one of the URLs above depending on where you run the API.

## Backend (apps/api)

```
# from repo root
npm install

# dev server with hot reload
npm run dev --filter=api

# production build
npm run build --filter=api
npm run start --filter=api

# Prisma helpers
npm run prisma:generate --workspace=apps/api
npm run prisma:migrate --workspace=apps/api    # create new migration locally
npm run prisma:deploy --workspace=apps/api     # apply migrations (Render)
```

### What exists now

- Express server split into `createApp` + bootstrap entry.
- `GET /api/health` pings Prisma/PostgreSQL (`SELECT 1`).
- Prisma schema defines `Scheme` + `NavHistory` tables with indexes that match the blueprint.
- `.env.example` documents all required secrets.
- Turbo caches `dist/**` artifacts from the API build.

### Render deployment notes

1. Create a Render Web Service pointing to this repo, use build command `cd apps/api && npm install && npm run build`, start command `cd apps/api && npm start`.
2. Attach the existing Postgres instance and expose its connection string as `DATABASE_URL` (internal URL recommended).
3. After the service builds, open a Render shell and run `DATABASE_URL=<render-url> npm run prisma:deploy --workspace=apps/api` to apply migrations.

## Next steps

- Implement MFapi proxy routes + pagination.
- Add Redis (Render key-value) for response caching — intentionally deferred until API + DB stabilise.
- Add AMFI ingestion cron + scripts — deferred to keep scope focused on connectivity.
- Replace `apps/web` with the Vite PWA shell per Quick Start guide.

Refer to `AGENTS.md`, `CLAUDE.md`, and `Technical-FAQ-Decisions.md` for the broader roadmap.
