# AGENTS.md - India Mutual Funds Data PWA

**Project**: India MF Data PWA (open-source, SEBI-compliant mutual fund intelligence)
**Scope**: Turborepo monorepo with Express + Prisma API, Vite React PWA frontend, Render + Vercel deployment
**Audience**: AI pair-programming agents (Copilot, Claude Code, Cursor, Replit, etc.)
**Last Updated**: November 2025

---

## 1. Mission & Operating Principles

The product exposes transparent Indian mutual fund data (NAV history, scheme metadata, portfolio tooling) with a privacy-first philosophy. Agents must:

1. **Honor compliance**: Never generate prescriptive investment advice. Always surface SEBI disclaimer blocks when showing performance metrics.
2. **Prefer public data sources**: Primary feeds are MFapi.in (ad-hoc) and AMFI NAVAll.txt (daily bulk). Do not introduce paid/closed feeds without approval.
3. **Build offline-first**: Service worker cache + IndexedDB must keep the PWA usable during Render cold starts.
4. **Optimize for low latency**: API budget is <300 ms for cache hits and <1.5 s for MFapi cold fetches. Use Redis caching and batched fetches.
5. **Design for resilience**: Rate-limit upstream calls, retry with exponential backoff, and fall back to cached data when MFapi/AMFI fail.
6. **Document decisions**: Update ADRs/FAQ when changing architecture or compliance-sensitive code paths.

---

## 2. Repository Layout

```
india-mf-data-pwa/
├── AGENTS.md                     # You are here
├── CLAUDE.md                     # Narrative dev brief
├── Quick-Start-Guide.md          # Phased implementation playbook
├── Technical-FAQ-Decisions.md    # Decision matrix & ADRs
├── README.md                     # Repo entry point
├── MF-Data-PWA-Blueprint.pdf     # Detailed blueprint (25 pages)
├── apps/
│   ├── api/                      # Express 5 + Prisma backend
│   │   ├── src/
│   │   │   ├── index.ts          # Server entry (health, funds proxy)
│   │   │   ├── services/         # MFApi + AMFI ingestion clients
│   │   │   ├── routes/           # REST endpoints (/api/*)
│   │   │   └── jobs/             # Cron + sync orchestration
│   │   ├── prisma/schema.prisma  # Scheme + NavHistory models
│   │   └── package.json
│   └── web/                      # Vite + React + Tailwind PWA
│       ├── src/
│       │   ├── App.tsx           # Shell + routes
│       │   ├── pages/            # Funds list, fund detail, SIP calc, etc.
│       │   ├── store/            # Redux Toolkit slices + RTK Query
│       │   ├── services/         # API hooks, SWR utilities
│       │   ├── components/       # UI primitives, charts
│       │   └── lib/storage/      # IndexedDB adapters (Dexie)
│       ├── public/               # PWA icons, manifest
│       └── package.json
├── configs/                      # Render/Vercel/turbo configs
├── scripts/                      # Data sync + AMFI parsers
└── .github/
    └── copilot-instructions.md   # Tool-specific guardrails
```

> Note: `apps/` folder will be created once the Turborepo scaffolding lands. For now, docs steer architecture and guardrail implementation-level decisions.

---

## 3. Architecture Snapshot

### Backend (apps/api)
- **Runtime**: Node 20 LTS, Express 5, TypeScript strict mode.
- **ORM**: Prisma with PostgreSQL (Render free tier, 1 GB storage).
- **Data Model**:
  - `Scheme`: schemeCode, schemeName, AMC metadata, categories, ISINs, JSON metadata.
  - `NavHistory`: schemeCode FK, navDate (Date), navValue (Decimal(12,4)), composites indexes for scheme/date.
- **Data Sources**:
  - `https://api.mfapi.in/mf` for scheme list + details.
  - `https://www.amfiindia.com/spages/NAVAll.txt` for nightly NAV ingest (~9 PM IST).
- **Caching**: Render Redis (Key-Value) with tag-based invalidation and TTL 15 minutes (MFapi) / 24 hours (AMFI snapshot metadata).
- **Jobs**: Render cron or Airflow DAG to fetch AMFI file, stage into PostgreSQL, update `NavHistory`, and evict caches.
- **API Surface** (initial):
  - `GET /api/health`
  - `GET /api/funds?limit=&offset=&q=` (server-side fuzzy search)
  - `GET /api/funds/:schemeCode`
  - `GET /api/funds/:schemeCode/nav?start=&end=`
  - `GET /api/portfolio/sip-calculator` (server-validated formula)
  - `POST /api/jobs/nav-sync` (protected, internal use)

### Frontend (apps/web)
- **Stack**: Vite + React 18 + TypeScript + TailwindCSS + Redux Toolkit + React Router + React Query (or RTK Query) + Recharts.
- **State**: Global slices for `funds`, `filters`, `portfolio`, `settings`. IndexedDB (Dexie) for offline caches (fund metadata, NAV history snapshots, portfolio entries).
- **UX Principles**: Sane skeleton loaders, stale-while-revalidate to hide Render cold starts, light/dark mode, accessible color palette (WCAG AA), disclaimers on analytics widgets.
- **PWA**: Service worker via `vite-plugin-pwa`, offline routes for `/funds`, `/funds/:code`, `/tools/sip` using cached JSON + fallback UI.
- **Charts**: Recharts timeseries for NAV, contributions vs returns, SIP projections.

### Shared Tooling
- Turborepo tasks: `dev`, `build`, `lint`, `test`, `format` using `turbo.json`.
- ESLint, Prettier, and TypeScript project references to share config between apps.
- Testing: Vitest + React Testing Library (frontend), Jest/Supertest (backend), plus contract tests across API surface.

---

## 4. Critical Workflows

1. **Data Sync Pipeline**
   1. Cron job downloads AMFI NAVAll.txt.
   2. Parser normalizes rows, deduplicates by schemeCode/navDate.
   3. Bulk upsert into PostgreSQL via Prisma `createMany` with `skipDuplicates`.
   4. Update Redis caches and emit `nav-history-updated` event (for future WebSocket/SSE streaming).

2. **Fund Search Flow**
   - Frontend dispatches `funds/searchRequested` with query.
   - API applies trigram/fuzzy search (e.g., PostgreSQL `pg_trgm`) returning top matches.
   - Client caches results in IndexedDB for offline fuzzy search fallback.

3. **Portfolio Tracker (Client-side)**
   - Dexie store `holdings` keyed by schemeCode.
   - NAV refresh worker updates valuations when online.
   - Export/import support via JSON file (since no auth).

4. **SIP Calculator**
   - Deterministic calculation on both client and server for parity.
   - Formula: `future_value = contribution * (((1 + rate/12)^(months) - 1) / (rate/12)) * (1 + rate/12)`.
   - Results flagged with disclaimer: "Past performance is not indicative...".

5. **Deployment**
   - Backend: Render web service per `render.yaml` (build `npm run build`, start `npm start`).
   - DB: Render PostgreSQL + Redis. Migration via `npx prisma migrate deploy` in Render shell.
   - Frontend: Vercel project `mf-data-web` (build `npm run build`, output `dist`).
   - Observability: Render logs + Vercel analytics + Sentry (future) for error tracking.

---

## 5. Coding Standards & Guardrails

- **TypeScript**: Strict true, no implicit any, prefer `zod` or custom runtime validators on inbound/outbound API payloads.
- **Error Handling**: Wrap external requests in `try/catch`, classify errors (`UpstreamError`, `ValidationError`, `RateLimitError`), and surface sanitized messages.
- **Networking**:
  - Use `node-fetch` or native `fetch` (Node 18+), with retries/backoff.
  - Respect MFapi rate limits (throttle to 5 req/sec).
  - Add `User-Agent: mf-data-pwa/1.0` header to all upstream requests.
- **Data Compliance**:
  - Never store PII; portfolio data stays local unless user consents to sync.
  - Always include disclaimers when presenting returns or risk indicators.
  - Do not expose predicted returns or prescriptive advice.
- **Security**:
  - `.env` required for `DATABASE_URL`, `REDIS_URL`, `PORT`, `MFAPI_BASE_URL` (optional override).
  - Validate schemeCode inputs (10-char alphanumeric) to prevent injection.
  - Sanitize AMFI text ingestion (strip HTML, handle invalid rows gracefully).
- **Testing**:
  - Backend endpoints require Supertest coverage (200 + failure paths).
  - Data sync scripts need fixture tests against sample AMFI file.
  - Frontend components must include accessibility checks (aria labels, tab order) and offline snapshot tests.

---

## 6. Delivery Roadmap (Reference)

| Phase | Focus | Key Deliverables |
|-------|-------|------------------|
| 0 | Repo + Turborepo scaffolding | Monorepo layout, lint/test tooling, env templates |
| 1 | Backend MVP | Express server, Prisma schema, `/api/health`, `/api/funds` (MFapi proxy), Render deployment |
| 1b | Data layer hardening | PostgreSQL migrations, AMFI ingest script, Redis caching |
| 2 | Frontend MVP | Vite React shell, funds grid, service worker, Tailwind styling |
| 2b | UX Enhancements | Search, fund details, charts, IndexedDB caching |
| 3 | Portfolio & Tools | Client-side tracker, SIP calculator, disclaimers, exports |
| 4 | Ops & Monitoring | Cron jobs, Render health checks, Lighthouse budget automation |

Agents should keep issues and PRs aligned with these phases and update this doc when priorities shift.

---

## 7. Reference Documents

- `Quick-Start-Guide.md` (4-hour MVP instructions)
- `Technical-FAQ-Decisions.md` (decision matrix, ADRs, compliance FAQ)
- `MF-Data-PWA-Blueprint.pdf` (full blueprint – consult offline viewer)
- `README.md` (public-facing summary)

Keep this file synchronized with those sources. When uncertain, escalate via issue comment instead of guessing.
