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

### Primary Personas

1. **Ananya (Retail Investor, Age 28)**
   - **Goal**: Compare ELSS funds quickly before tax season deadline
   - **Pain Points**: Scattered data across multiple websites, no offline access, confusing metrics
   - **Journey**:
     1. Opens PWA on mobile during commute (offline capability kicks in)
     2. Searches "HDFC Tax Saver" using smart search with autocomplete
     3. Adds 3 ELSS funds to comparison view (side-by-side metrics)
     4. Views interactive NAV charts with 3-year history
     5. Exports comparison report as PDF for spouse review
     6. Stars favorite fund for later tracking
   - **Success Metrics**: Decision made in <10 minutes, exports report, returns next month

2. **Ravi (DIY Portfolio Enthusiast, Age 42)**
   - **Goal**: Track 12 SIPs meticulously and optimize returns
   - **Pain Points**: Cold starts blocking nightly check-ins, no rebalancing guidance, manual calculations
   - **Journey**:
     1. Opens PWA at 10 PM (expects instant load via service worker)
     2. Portfolio dashboard shows all holdings with live valuations
     3. Reviews portfolio rebalancing suggestions (drift detection)
     4. Uses tax harvesting calculator for LTCG optimization
     5. Sets up goal-based tracker for retirement corpus (₹2 Cr in 15Y)
     6. Exports portfolio snapshot as CSV for annual tax filing
   - **Success Metrics**: <2s load time offline, portfolio insights surfaced, tax savings identified

3. **Neha (Developer / Researcher, Age 31)**
   - **Goal**: Build backtest engine using public MF data APIs
   - **Pain Points**: Rate limits unclear, schema changes break scripts, no bulk export
   - **Journey**:
     1. Reads API documentation on `/api-explorer` page
     2. Tests `/api/funds` endpoint with pagination and filtering
     3. Downloads bulk NAV history via CSV export (batched by category)
     4. Integrates API into Python backtest script with retry logic
     5. Subscribes to schema change notifications (future)
   - **Success Metrics**: 100+ API calls/day without throttling, stable schema, CSV exports work

### Secondary Personas

4. **Priya (First-Time Investor, Age 24)**
   - **Need**: Guided onboarding to understand mutual fund basics
   - **Journey**: Interactive tutorial → Set financial goal → Recommended starter funds → Sample SIP calculation

5. **Karthik (Tax Consultant, Age 48)**
   - **Need**: Quickly assess client portfolio tax implications
   - **Journey**: Import CAS file → Tax harvesting analysis → LTCG/STCG breakdown → Generate client report

6. **Meera (Financial Blogger, Age 35)**
   - **Need**: Research fund trends for blog content
   - **Journey**: Category heatmap → Identify trending sectors → Export charts for blog → Embed API data widgets

---

## 3. Non-Negotiables

- **Compliance**: Every performance widget includes the SEBI disclaimer snippet. No predictive phrases ("will deliver", "guaranteed").
- **Data Integrity**: Nightly AMFI sync must finish <5 min with idempotent upserts. Missing NAV rows are logged + surfaced in admin dashboard (future).
- **Offline UX**: Service worker caches shell + last successful responses. Portfolio data never leaves device unless user exports.
- **Resilience**: API embraces stale-while-revalidate semantics; cold starts should still serve cached responses instantly.

---

## 4. Current Focus & Priorities

### Completed Milestones ✅

| Track | Status |
|-------|--------|
| **Backend MVP** | Express 5 + Prisma deployed, `/api/funds` & `/api/funds/:code/nav` with YYYY-MM-DD validation, Vitest + Supertest harness merged |
| **Frontend Shell** | PWA shell live with funds grid, NAV charts, disclaimers, IndexedDB (Dexie) caching, SIP calculator with backend parity |
| **Data Jobs** | AMFI parser + batching script production-ready |
| **Offline Support** | Service worker + manifest + cache-first strategy operational |

### Current Sprint: UI/UX Phase 1 (Dec 2025) 🚧

**Goal**: Elevate user experience to match best-in-class fintech apps while maintaining SEBI compliance

**Priority 1 - Comparison & Discovery**
- [ ] **Fund Comparison Tool**: Side-by-side view for up to 3 funds with metrics diff
- [ ] **Advanced Filtering**: Multi-select categories, AUM range, expense ratio filters
- [ ] **Smart Search**: Autocomplete, fuzzy matching, recent searches, category suggestions
- [ ] **Watchlist/Favorites**: Star funds, quick access drawer, sync to IndexedDB

**Priority 2 - Feedback & Polish**
- [ ] **Loading Skeletons**: Replace spinners with content-aware skeletons (cards, charts, tables)
- [ ] **Toast Notifications**: Success/error/info toasts for user actions (saved, exported, failed)
- [ ] **Empty States**: Illustrative placeholders for no results, no data scenarios
- [ ] **Error Boundaries**: Graceful error handling with recovery actions

**Priority 3 - Export & Sharing**
- [ ] **CSV Export**: Portfolio holdings, fund lists, NAV history with custom date ranges
- [ ] **PDF Reports**: Fund analysis report with charts, metrics, disclaimers
- [ ] **Share Links**: Deep links to specific fund/comparison views

### Next Sprint: UI/UX Phase 2 (Jan 2026)

**Advanced Visualizations**
- Category performance heatmap (color-coded by 1Y/3Y/5Y returns)
- Multi-fund NAV overlay charts with normalized view option
- Risk-return scatter plot (volatility vs returns)
- SIP growth curve with contributions vs returns breakdown
- Historical returns bar chart (1Y/3Y/5Y comparisons)

### Backend Enhancements (Parallel Track)
- Redis caching layer (15min TTL for MFapi, 24h for AMFI metadata)
- Render cron job for nightly AMFI sync (9 PM IST)
- Contract tests for MFapi + AMFI format stability
- Upstream timeout tuning + retry backoff optimization

---

## 5. Tech Stack Snapshot

- **Backend**: Node 20, Express 5, TypeScript, Prisma, PostgreSQL, Redis cache (pending), Zod validation, tz-aware date filters.
- **Frontend**: Vite + React 18 + TS, Tailwind, React Router, Redux Toolkit/RTK Query, Dexie (IndexedDB), `vite-plugin-pwa`, Recharts.
- **Tooling**: Turborepo, ESLint (flat), Prettier, **Vitest + Supertest** (backend), React Testing Library + Playwright (frontend plan), Render (API + Postgres + KV), Vercel (web), GitHub Actions CI.

---

## 6. Design Tenets

1. **Transparent Data**: Source info, last-updated timestamp, and error states visible on every data surface.
2. **Graceful Degradation**: When live data unavailable, show cached value + timestamp + toast about background refresh.
3. **Performance Budgets**: LCP <2.5 s on mid-tier Android, JS bundle <200 KB for initial route, API <300 ms for cached responses.
4. **Human Tone**: Tooltips explain metrics plainly ("5Y CAGR = compounded annual growth over 5 years").

---

## 7. Comprehensive Feature Backlog

### Immediate (Dec 2025)
**UI/UX Phase 1**
- Fund comparison tool (up to 3 funds)
- Advanced filtering (categories, AUM, returns)
- Smart search with autocomplete
- Watchlist/favorites with IndexedDB sync
- Loading skeletons for all async content
- Toast notification system
- CSV/PDF export capabilities

**Backend Hardening**
- Redis cache layer (MFapi + AMFI)
- Render cron for nightly AMFI sync
- Contract tests for upstream API stability
- Upstream timeout + retry optimization

### Short-Term (Q1 2026)
**UI/UX Phase 2 - Visualizations**
- Category performance heatmap
- Multi-fund comparison charts
- Risk-return scatter plots
- SIP projection visualization
- Historical returns bar charts

**UI/UX Phase 3 - Accessibility & Mobile**
- Keyboard navigation shortcuts (`Ctrl+K` search, etc.)
- Enhanced ARIA support for screen readers
- Mobile gesture support (swipe, pull-to-refresh)
- Responsive touch optimizations

**Testing Infrastructure**
- Playwright PWA smoke suite (offline/online)
- Visual regression tests (Percy/Chromatic)
- Lighthouse CI integration
- Accessibility audit automation (axe-core)

### Mid-Term (Q2 2026)
**UI/UX Phase 4 - Power User Features**
- Goal-based financial planner
- Portfolio rebalancing suggestions
- Tax harvesting calculator (LTCG/STCG)
- Advanced fund screener (Sharpe, alpha, beta)
- Benchmark comparison (Nifty/Sensex overlay)

**Data Enhancements**
- CAS file import (CAMS/Karvy parsing)
- Historical benchmark data ingestion
- Fund manager change tracking
- Scheme merge/split handling

### Long-Term (Q3-Q4 2026)
**UI/UX Phase 5 - Onboarding & Education**
- Interactive first-time user tour
- Contextual help tooltips
- Educational content library
- Video tutorials integration
- Feature announcements system

**Community Features** (Auth Required)
- User-generated fund reviews (moderated)
- Investment goal templates sharing
- Anonymous portfolio benchmarking
- Discussion forums (SEBI-compliant)

**Advanced Analytics**
- AI-powered fund recommendations (explainable)
- Sentiment analysis from SEBI filings
- Correlation matrix for diversification
- Monte Carlo simulation for SIPs
- Real-time alerts (price targets, rebalancing)

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
- Tests: Backend Vitest + Supertest suites (services + routes), AMFI fixture coverage, frontend RTL + future Playwright offline banner tests; see `TESTING.md` for the authoritative list.

---

## 10. Collaboration Etiquette

- Keep PR summaries action-focused. Reference blueprint sections when deviating.
- Update `Technical-FAQ-Decisions.md` with new ADRs.
- Use GitHub Discussions for roadmap shifts >1 sprint.
- Prefer plain English commit messages over emoji.

Stay kind, stay factual, ship responsibly. 🛟
