# CLAUDE.md - India MF Data PWA Brief

**Product**: India Mutual Funds Data Progressive Web App
**Owner**: Ian Pinto (open-source initiative)
**Vision**: Radical transparency for Indian retail investors via SEBI-safe analytics, offline-first UX, and public APIs.
**Date**: 23 Nov 2025

---

## 1. Story & Purpose

Retail investors juggle scattered AMFI PDFs, fund house fact sheets, and unreliable finfluencer advice. MFapi.in exposes raw NAV feeds but lacks UX polish, while AMFI files require manual parsing. This project bridges the gap with an open PWA that:
- Aggregates NAV and scheme metadata with nightly accuracy
- Works offline even when Render free-tier services cold start
- Keeps user portfolios private (client-side IndexedDB) yet exportable
- Educates through tools (SIP calculator, category heatmaps) without violating SEBI advertising rules

The MVP must prove that high-quality, compliant tooling can ship quickly without centralized user accounts.

---

## 2. Personas & Journeys

1. **Ananya (Retail Investor)**
   - Wants to compare ELSS funds quickly before tax season
   - Opens PWA on mobile, searches "HDFC Tax Saver", views NAV chart, downloads CSV
   - Needs clarity that results are historical, not advice

2. **Ravi (DIY Portfolio Nerd)**
   - Tracks 12 SIPs; frustrated when cold starts block his nightly ritual
   - Expects offline load and local storage of holdings, plus export/import safety net

3. **Neha (Developer / Researcher)**
   - Wants open APIs for a weekend backtest script
   - Hits `/api/funds` with rate limits documented; expects schema stability

---

## 3. Non-Negotiables

- **Compliance**: Every performance widget includes the SEBI disclaimer snippet. No predictive phrases ("will deliver", "guaranteed").
- **Data Integrity**: Nightly AMFI sync must finish <5 min with idempotent upserts. Missing NAV rows are logged + surfaced in admin dashboard (future).
- **Offline UX**: Service worker caches shell + last successful responses. Portfolio data never leaves device unless user exports.
- **Resilience**: API embraces stale-while-revalidate semantics; cold starts should still serve cached responses instantly.

---

## 4. Current Focus (Sprint 0 → Sprint 1)

| Track | Objectives |
|-------|------------|
| **Repo Bootstrap** | Turborepo scaffold, shared eslint/prettier configs, `pnpm` or `npm` workspace setup, `.env.example`. |
| **Backend MVP** | Express 5 server, Prisma schema, `/api/health`, `/api/funds` proxy using MFapi, error normalization, Render deploy. |
| **Data Jobs** | AMFI parser script + fixtures, Prisma migration `init`, doc on running `npx prisma migrate dev`. |
| **Frontend Shell** | Vite React TS, Tailwind, dark/light theme toggle, funds list hitting API, placeholder disclaimers. |
| **Ops** | `render.yaml`, instructions for manual migration, README update covering dev scripts + deployment. |

---

## 5. Tech Stack Snapshot

- **Backend**: Node 20, Express 5, TypeScript, Prisma, PostgreSQL, Redis cache, Zod for validation, Nodemon/tsx for dev.
- **Frontend**: Vite + React 18 + TS, Tailwind, React Router, Redux Toolkit or RTK Query, React Query (if needed), Recharts, Dexie (IndexedDB), `vite-plugin-pwa`.
- **Tooling**: Turborepo, ESLint (flat config), Prettier, Vitest/Jest, Playwright (later), Render (API + Postgres + KV), Vercel (web), GitHub Actions for CI.

---

## 6. Design Tenets

1. **Transparent Data**: Source info, last-updated timestamp, and error states visible on every data surface.
2. **Graceful Degradation**: When live data unavailable, show cached value + timestamp + toast about background refresh.
3. **Performance Budgets**: LCP <2.5 s on mid-tier Android, JS bundle <200 KB for initial route, API <300 ms for cached responses.
4. **Human Tone**: Tooltips explain metrics plainly ("5Y CAGR = compounded annual growth over 5 years").

---

## 7. Backlog Highlights

- Week 1: Redis cache, fund detail page with NAV chart, fuzzy search endpoint, IndexedDB portfolio skeleton.
- Week 2: SIP calculator, nightly cron hooking AMFI, Lighthouse regression checks, responsiveness polish.
- Futures: CAS PDF import (client-side), custom alerts (requires auth), comparative analytics, watchlists synced via Supabase.

---

## 8. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Render cold starts (60+ sec) | Poor UX | Aggressive SW caching, offline messaging, optional uptime pings |
| MFapi downtime | Data gaps | Retry with exponential backoff, fallback to cached snapshot, add AMFI delta fetch |
| Postgres quota (1 GB) | Data loss | Store last 5 years for top 1000 funds, fetch on demand for long tail |
| Compliance drift | Regulatory exposure | Centralize disclaimer component, lint for banned phrases, manual review |

---

## 9. Definition of Done (MVP)

- CLI `npm run dev` boots both API (3001) and web (5173) via Turborepo pipeline.
- `/api/funds` returns JSON (first 10 funds) with cache headers + source metadata.
- Frontend lists funds, handles loading/error states, and renders disclaimers.
- `render.yaml` provisions API service + PostgreSQL database; README documents deploy steps.
- Tests: Backend unit (services), integration (routes), frontend component tests for list + offline banner.

---

## 10. Collaboration Etiquette

- Keep PR summaries action-focused. Reference blueprint sections when deviating.
- Update `Technical-FAQ-Decisions.md` with new ADRs.
- Use GitHub Discussions for roadmap shifts >1 sprint.
- Prefer plain English commit messages over emoji.

Stay kind, stay factual, ship responsibly. 🛟
