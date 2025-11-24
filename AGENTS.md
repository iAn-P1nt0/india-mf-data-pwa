# AGENTS.md - India Mutual Funds Data PWA

**Project**: India MF Data PWA (open-source, SEBI-compliant mutual fund intelligence)
**Scope**: Turborepo monorepo with Express + Prisma API, Vite React PWA frontend, Render + Vercel deployment
**Audience**: AI pair-programming agents (Copilot, Claude Code, Cursor, Replit, etc.)
**Last Updated**: November 2025 (Backend MFapi validation + Vitest harness landing)

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
  - `https://api.mfapi.in/mf` for scheme list + details (now proxied with server-side query + date-window validation).
  - `https://www.amfiindia.com/spages/NAVAll.txt` for nightly NAV ingest (~9 PM IST) — parser + batching are implemented, cron + cache eviction wiring pending.
- **Caching**: Render Redis (Key-Value) with tag-based invalidation and TTL 15 minutes (MFapi) / 24 hours (AMFI snapshot metadata).
- **Jobs**: Render cron or Airflow DAG to fetch AMFI file, stage into PostgreSQL, update `NavHistory`, and evict caches.
- **API Surface** (current):
  - `GET /api/health`
  - `GET /api/funds?limit=&offset=&q=` (server-side fuzzy search + SEBI disclaimer metadata)
  - `GET /api/funds/:schemeCode` (MFapi metadata proxy)
  - `GET /api/funds/:schemeCode/nav?start=&end=` (YYYY-MM-DD validation + server-side filtering, returns 400 on bad ranges)
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
- Testing (see `TESTING.md` for evolving matrix): backend uses Vitest + Supertest (landed), AMFI scripts consume fixtures, frontend to adopt React Testing Library + Playwright PWA suite once shell is online, contract/API tests will guard MFapi + AMFI boundaries.

---

## 4. Critical Workflows

1. **Data Sync Pipeline** (parser done, cron + cache invalidation pending)
  1. Parser & batching script download AMFI NAVAll.txt, normalize, dedupe.
  2. Bulk upsert into PostgreSQL via Prisma `createMany` with `skipDuplicates` (already implemented).
  3. Next: wire Render cron (or Airflow DAG) to run nightly, invalidate Redis caches, emit `nav-history-updated` events.

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
- **Testing** (see `TESTING.md` for the living checklist):
  - Backend endpoints must land with Vitest + Supertest suites (happy paths + MFapi failure simulation + validation errors).
  - AMFI scripts need fixture-driven unit tests + contract tests to ensure parser compatibility when AMFI format shifts.
  - Frontend work will pair React Testing Library unit tests with Playwright PWA smoke tests (offline, IndexedDB sync, SIP calculator parity) once the shell ships.

---

## 6. Delivery Roadmap (Reference)

| Phase | Focus | Key Deliverables |
|-------|-------|------------------|
| 0 | Repo + Turborepo scaffolding | Monorepo layout, lint/test tooling, env templates |
| 1 | Backend MVP | Express server, Prisma schema, `/api/health`, `/api/funds` proxy (now with date validation) |
| 1b | Data layer hardening | AMFI parser shipped (✅), next: cron automation, Redis caching, contract tests |
| 2 | Frontend MVP | **Priority order:** PWA shell → IndexedDB caching adapters → SIP tooling UI; includes service worker + Tailwind baseline |
| 2b | UX Enhancements | Search UX polish, charts, dark mode, advanced filters |
| 3 | Portfolio & Tools | Client-side tracker, SIP calculator parity, exports |
| 4 | Ops & Monitoring | Cron jobs live, Render health checks, Lighthouse & Playwright CI |
| **5** | **UI/UX Phase 1** | **Advanced filtering, fund comparison, watchlist, loading skeletons, toast notifications, export (CSV/PDF)** |
| **6** | **UI/UX Phase 2** | **Category heatmaps, comparative charts, returns distribution, SIP projection charts** |
| **7** | **UI/UX Phase 3** | **Keyboard shortcuts, enhanced ARIA, mobile gestures, responsive optimizations** |
| **8** | **UI/UX Phase 4** | **Goal-based planner, portfolio rebalancing, tax calculators, fund screener, benchmark comparison** |
| **9** | **UI/UX Phase 5** | **Interactive onboarding, contextual help, educational content, feature announcements** |

Agents should keep issues and PRs aligned with these phases and update this doc when priorities shift.

---

## 7. UI/UX Component Patterns & Best Practices

### Design System Principles

**Color System**
- Primary: `#2563eb` (blue-600) – CTAs, links, active states
- Success: `#10b981` (emerald-500) – positive returns, success states
- Warning: `#f59e0b` (amber-500) – disclaimers, cautionary info
- Error: `#ef4444` (red-500) – losses, error states
- Neutral: Gray scale (50-900) – text, borders, backgrounds

**Typography Scale**
- Hero: `clamp(2rem, 4vw, 2.75rem)` – landing page headlines
- H1: `2rem` (32px) – page titles
- H2: `1.5rem` (24px) – section headers
- H3: `1.25rem` (20px) – card titles
- Body: `1rem` (16px) – default text
- Small: `0.875rem` (14px) – metadata, captions
- Tiny: `0.75rem` (12px) – disclaimers, labels

**Spacing Scale (8px base)**
- xs: `4px`, sm: `8px`, md: `16px`, lg: `24px`, xl: `32px`, 2xl: `48px`, 3xl: `64px`

### Component Guidelines

#### 1. Loading States
**Skeleton Loaders** (preferred over spinners for content)
```tsx
// Pattern: Use semantic HTML + aria-busy
<div className={styles.skeleton} aria-busy="true" aria-label="Loading fund data">
  <div className={styles.skeletonTitle} />
  <div className={styles.skeletonText} />
  <div className={styles.skeletonChart} />
</div>
```

**Spinner** (for actions/buttons only)
```tsx
<button disabled={isLoading}>
  {isLoading ? <Spinner size="sm" /> : "Calculate"}
</button>
```

#### 2. Toast Notifications
**Pattern**: Non-blocking, auto-dismissible, queue-managed
```tsx
// Usage
toast.success("Fund added to watchlist");
toast.error("Failed to fetch NAV data");
toast.info("Portfolio exported successfully", { duration: 5000 });
```

**Accessibility**: Must include `role="status"` or `role="alert"` and `aria-live="polite"` or `"assertive"`

#### 3. Modal/Dialog
**Pattern**: Focus trap, ESC to close, backdrop click to dismiss
```tsx
<Dialog open={isOpen} onClose={handleClose}>
  <Dialog.Title>Compare Funds</Dialog.Title>
  <Dialog.Content>...</Dialog.Content>
  <Dialog.Actions>
    <Button variant="secondary" onClick={handleClose}>Cancel</Button>
    <Button variant="primary" onClick={handleConfirm}>Compare</Button>
  </Dialog.Actions>
</Dialog>
```

**Accessibility**: `role="dialog"`, `aria-modal="true"`, focus management, keyboard trapping

#### 4. Data Tables
**Pattern**: Sortable columns, filterable, pagination, responsive collapse
```tsx
<Table>
  <Table.Header>
    <Table.HeaderCell sortable onSort={handleSort}>Scheme Name</Table.HeaderCell>
    <Table.HeaderCell sortable>NAV</Table.HeaderCell>
    <Table.HeaderCell>1Y Return</Table.HeaderCell>
  </Table.Header>
  <Table.Body>
    {funds.map(fund => (
      <Table.Row key={fund.schemeCode}>
        <Table.Cell>{fund.schemeName}</Table.Cell>
        <Table.Cell>₹{fund.nav}</Table.Cell>
        <Table.Cell data-positive={fund.return1Y >= 0}>
          {fund.return1Y}%
        </Table.Cell>
      </Table.Row>
    ))}
  </Table.Body>
</Table>
```

**Mobile**: Stack cells vertically or use horizontal scroll with sticky column

#### 5. Filter Panel
**Pattern**: Collapsible, multi-select, clear all, apply on change
```tsx
<FilterPanel>
  <FilterGroup label="Category">
    <Checkbox value="equity" checked onChange={handleCategoryChange}>
      Equity
    </Checkbox>
    <Checkbox value="debt" checked onChange={handleCategoryChange}>
      Debt
    </Checkbox>
  </FilterGroup>
  <FilterGroup label="Returns">
    <RangeSlider min={0} max={50} value={returnRange} onChange={handleReturnChange} />
  </FilterGroup>
  <FilterActions>
    <Button variant="ghost" onClick={handleClearAll}>Clear All</Button>
    <Button variant="primary" onClick={handleApply}>Apply Filters</Button>
  </FilterActions>
</FilterPanel>
```

**Accessibility**: `role="region"`, `aria-label="Filter funds"`, keyboard navigation

#### 6. Chart Components
**Pattern**: Responsive container, tooltips, legend, accessibility labels
```tsx
<ResponsiveContainer width="100%" height={400}>
  <AreaChart data={navPoints} accessibilityLayer>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="date" tickFormatter={formatDate} />
    <YAxis tickFormatter={formatCurrency} />
    <Tooltip content={<CustomTooltip />} />
    <Area 
      type="monotone" 
      dataKey="nav" 
      stroke="#2563eb" 
      fill="url(#gradient)"
      aria-label="NAV over time"
    />
  </AreaChart>
</ResponsiveContainer>
```

**Accessibility**: Provide data table alternative or `<desc>` element summarizing trends

#### 7. Empty States
**Pattern**: Illustrative, actionable, friendly tone
```tsx
<EmptyState
  icon={<SearchIcon />}
  title="No funds found"
  description="Try adjusting your filters or search query"
  action={
    <Button variant="primary" onClick={handleClearFilters}>
      Clear Filters
    </Button>
  }
/>
```

#### 8. Error States
**Pattern**: Clear message, recovery action, optional retry
```tsx
<ErrorState
  title="Failed to load NAV data"
  message="The API is currently unavailable. We'll retry automatically."
  action={
    <Button variant="secondary" onClick={handleRetry}>
      Retry Now
    </Button>
  }
/>
```

### Interaction Patterns

#### Keyboard Shortcuts
- `Ctrl+K` or `Cmd+K`: Global search
- `Ctrl+/` or `Cmd+/`: Show keyboard shortcuts
- `Esc`: Close modal/dialog
- `Tab`: Navigate form fields
- `Arrow keys`: Navigate lists/menus
- `Enter`: Confirm action

#### Mobile Gestures
- **Swipe right**: Add to watchlist (fund cards)
- **Swipe left**: Remove from watchlist
- **Pull down**: Refresh data
- **Pinch**: Zoom chart (if applicable)
- **Long press**: Show context menu

#### Loading Strategies
1. **Optimistic UI**: Update UI immediately, rollback on error
2. **Skeleton First**: Show skeleton, replace with data
3. **Stale-While-Revalidate**: Show cached data, fetch fresh in background
4. **Progressive Enhancement**: Core content first, enhancements after

### Accessibility Checklist
- [ ] All interactive elements have `:focus-visible` styles
- [ ] Form inputs have associated `<label>` elements
- [ ] Images have `alt` text (or `alt=""` if decorative)
- [ ] Color contrast ratio ≥4.5:1 for text, ≥3:1 for UI elements
- [ ] Touch targets ≥44x44px on mobile
- [ ] Semantic HTML (`<nav>`, `<main>`, `<article>`, etc.)
- [ ] ARIA attributes only when semantic HTML insufficient
- [ ] Keyboard navigation for all interactive elements
- [ ] Screen reader testing with NVDA/JAWS/VoiceOver

### Performance Budgets
- **First Contentful Paint (FCP)**: <1.8s
- **Largest Contentful Paint (LCP)**: <2.5s
- **First Input Delay (FID)**: <100ms
- **Cumulative Layout Shift (CLS)**: <0.1
- **Time to Interactive (TTI)**: <3.8s
- **JavaScript Bundle**: <200KB initial, <100KB per route
- **Images**: WebP format, lazy loading, responsive srcset

---

## 8. Reference Documents

- `Quick-Start-Guide.md` (4-hour MVP instructions)
- `DEPLOYMENT.md` (frontend deployment architecture + CI/CD guardrails)
- `Technical-FAQ-Decisions.md` (decision matrix, ADRs, compliance FAQ)
- `MF-Data-PWA-Blueprint.pdf` (full blueprint – consult offline viewer)
- `README.md` (public-facing summary + UI/UX roadmap)

Keep this file synchronized with those sources. When uncertain, escalate via issue comment instead of guessing.
