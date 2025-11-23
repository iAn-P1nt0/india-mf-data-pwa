````instructions
# copilot-instructions.md - GitHub Copilot Guardrails for India MF Data PWA

**Project**: India Mutual Funds Data PWA
**Stack**: Turborepo, Node 20, Express 5, Prisma/PostgreSQL, Vite React TS, Tailwind, Redux Toolkit, Dexie, Render, Vercel
**Goal**: Offline-first, SEBI-compliant mutual fund intelligence platform

---

## Context Recap

- Backend (`apps/api`): Express 5 + TypeScript + Prisma. Provides `/api/health`, `/api/funds`, `/api/funds/:schemeCode`, NAV history endpoints, SIP calculator, and internal job hooks. Data from MFapi.in (real-time) and AMFI NAVAll.txt (nightly). Uses PostgreSQL (Render) + Redis cache.
- Frontend (`apps/web`): Vite React app with Tailwind, React Router, Redux Toolkit/RTK Query, React Query, Recharts, Dexie for IndexedDB, `vite-plugin-pwa` for service worker/offline shell.
- Compliance: No predictive returns. Mandatory SEBI disclaimer on any performance/analytics view. Portfolio data remains client-side.

Key references: `Quick-Start-Guide.md`, `Technical-FAQ-Decisions.md`, `AGENTS.md`, `CLAUDE.md`, `MF-Data-PWA-Blueprint.pdf`.

---

## Generation Playbook

### Backend Code
- **Project layout**:
  - Entry: `apps/api/src/index.ts`
  - Services: `apps/api/src/services/MFApiService.ts`, `.../AMFIIngestService.ts`
  - Routes: `apps/api/src/routes/*.ts`
  - Prisma: `apps/api/prisma/schema.prisma`
- **Patterns**:
  - Use `Router` modules per resource. Mount under `/api`.
  - Validate all params with `zod` or custom guards (schemeCode max 10 chars, alphanumeric).
  - Wrap external fetches in retry/backoff (3 attempts, exponential). Add `User-Agent` header.
  - Cache MFapi responses in Redis with structured keys (`mfapi:funds:page:0`). TTL 15 min.
  - Log structured JSON (level, msg, meta). Never log secrets or portfolio payloads.
  - Prisma queries should scope fields (`select`) to reduce payload size.
  - Use `createMany` + `skipDuplicates` for AMFI ingests; commit inside transaction.

```typescript
// Health route template
router.get('/health', async (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION ?? 'dev',
    deps: ['postgres', 'redis'],
  });
});
```

### Frontend Code
- **Structure**:
  - `src/routes` for page-level components, lazy-loaded via React Router.
  - `src/features/*` for Redux slices + hooks (e.g., `fundsSlice`, `portfolioSlice`).
  - `src/components/ui` for reusable primitives (Card, Button, MetricTile).
  - `src/lib/storage/indexedDb.ts` for Dexie wrappers.
- **Patterns**:
  - Fetch data through RTK Query or React Query hooks; enable SWR to mask cold starts.
  - Always show `DataAsOf` component with ISO timestamp + Source label.
  - Wrap PWA-critical assets in `vite-plugin-pwa` manifest.
  - Use Recharts `<ResponsiveContainer>` for charts; guard against missing NAV arrays.
  - Service worker should precache shell + fallback JSON. Provide offline banner using `navigator.onLine` + SW events.
  - Portfolio data operations run through Dexie transactions; offer export/import JSON.

```tsx
// Example fund card snippet
<Card>
  <p className="text-xs text-muted">{fund.schemeCode}</p>
  <h3 className="text-base font-semibold">{fund.schemeName}</h3>
  <DataAsOf timestamp={fund.lastUpdated} source="MFapi.in" />
  <Disclaimer variant="sebi" />
</Card>
```

### Compliance Snippet
Always include this disclaimer (or component variant) when presenting returns/performance:

```
Mutual fund investments are subject to market risks. Read all scheme related documents carefully. Historical returns do not guarantee future performance.
```

---

## Guardrails & Anti-patterns

| Do | Do Not |
|----|--------|
| Use environment variables from `.env` (`DATABASE_URL`, `REDIS_URL`, `PORT`, etc.) | Hardcode credentials or API base URLs |
| Validate all MFapi/AMFI payloads | Trust upstream data blindly |
| Use `fetch` with timeout + retry | Call MFapi without guarding against rate limits |
| Serve cached data immediately, refresh in background | Block UI while waiting for fresh data |
| Store portfolios in IndexedDB and mark storage quota | Send holdings to API before explicit opt-in |
| Add integration tests for new endpoints | Merge API changes without tests |

---

## Testing Expectations

- Backend: Jest or Vitest + Supertest per route (2xx, 4xx, 5xx). Mock MFapi with MSW or nock. Add fixtures for AMFI parser.
- Frontend: Vitest + React Testing Library. Cover loading/error/empty states, offline banner, disclaimers. Use msw to stub API responses.
- E2E (future): Playwright to validate offline PWA, install prompts, and search UX.

---

## Deployment Notes

- Render service builds with `cd apps/api && npm install && npm run build`. Start with `npm start` (Node in `dist`).
- Run `npx prisma migrate deploy` after provisioning database.
- Vercel web project runs `cd apps/web && npm install && npm run build`; output `apps/web/dist`.
- Keep `render.yaml` and `.vercel/project.json` updated when commands change.

---

## Common Snippets

```typescript
// Prisma client singleton
import { PrismaClient } from '@prisma/client';
const prisma = globalThis.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}
export default prisma;
```

```tsx
// React Query stale-while-revalidate
const {
  data,
  isLoading,
  isFetching,
  error,
} = useQuery({
  queryKey: ['funds', filters],
  queryFn: fetchFunds,
  staleTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
});
```

---

## Submission Checklist

Before finishing a change, Copilot should ensure:
1. Code respects architecture + compliance rules above.
2. Disclaimers present on any UI surface showing returns.
3. Tests or fixtures updated for new logic.
4. Docs (`Quick-Start-Guide`, ADRs) patched if behavior changes.
5. ESLint/Prettier + type checks pass locally (`turbo lint type-check`).

Keep contributions consistent with `AGENTS.md` and `CLAUDE.md`. When uncertain, prefer conservative defaults and leave TODO comments referencing the source doc section.
````
