````instructions
# copilot-instructions.md - GitHub Copilot Guardrails for India MF Data PWA

**Project**: India Mutual Funds Data PWA
**Stack**: Turborepo, Node 20, Express 5, Prisma/PostgreSQL, Vitest + Supertest, Next.js 16, Tailwind, React Query, Dexie, Render, Vercel
**Goal**: Offline-first, SEBI-compliant mutual fund intelligence platform

---

## Context Recap

- Backend (`apps/api`): Express 5 + TypeScript + Prisma. Provides `/api/health`, `/api/funds`, `/api/funds/:schemeCode`, NAV history endpoints (now enforcing YYYY-MM-DD validation + server-side filtering), SIP calculator, and internal job hooks. Data from MFapi.in (real-time) and AMFI NAVAll.txt (nightly). Uses PostgreSQL (Render) + Redis cache (pending).
- Frontend (`apps/web`): **Next.js 16** app with Tailwind, React Query, Recharts, Dexie for IndexedDB, service worker for PWA/offline shell.
- Compliance: No predictive returns. Mandatory SEBI disclaimer on any performance/analytics view. Portfolio data remains client-side.

Key references: `Quick-Start-Guide.md`, `Technical-FAQ-Decisions.md`, `AGENTS.md`, `CLAUDE.md`, `MF-Data-PWA-Blueprint.pdf`, `README.md` (UI/UX roadmap).

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
  - Cache MFapi responses in Redis with structured keys (`mfapi:funds:page:0`). TTL 15 min (todo once Redis provisioned).
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

### Frontend Code (Next.js 16)
- **Structure**:
  - `app/` for Next.js pages with file-based routing
  - `components/` organized by feature (funds, portfolio, charts, common, pwa, sip, metrics)
  - `hooks/` for custom React hooks (useFundPreview, useNavHistory, usePortfolioStore, etc.)
  - `lib/` for utilities (config, types, cache-db for Dexie, sip calculations)
- **Patterns**:
  - All client components **must** start with `"use client"` directive
  - Use Next.js `<Link>` for navigation, never `<a>` tags for internal routes
  - Fetch data through React Query hooks (useQuery, useMutation); enable SWR to mask cold starts
  - Always show data source + timestamp + disclaimer on performance views
  - Use Recharts `<ResponsiveContainer>` for charts; guard against missing NAV arrays
  - Service worker should precache shell + fallback JSON. Provide offline banner using `navigator.onLine`
  - Portfolio data operations run through Dexie transactions; offer export/import JSON
  - CSS Modules for component-specific styles (`*.module.css`)
  - Global styles in `app/globals.css` using CSS custom properties for theming

```tsx
// Example fund card with Next.js patterns
"use client";

import Link from "next/link";
import { useFundPreview } from "@/hooks/useFundPreview";
import styles from "./FundCard.module.css";

export function FundCard({ fund }: { fund: FundPreview }) {
  return (
    <Link href={`/funds/${fund.schemeCode}`} className={styles.card}>
      <span className={styles.code}>{fund.schemeCode}</span>
      <h3 className={styles.name}>{fund.schemeName}</h3>
      <p className={styles.category}>{fund.schemeCategory}</p>
    </Link>
  );
}
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

- Backend: **Vitest + Supertest** per route (2xx, 4xx, 5xx). Mock MFapi via `fetch` stubs/MSW. Include validation + upstream failure cases. AMFI parser must have fixture tests.
- Frontend: Vitest + React Testing Library for list/offline/disclaimer states; once the PWA shell ships, add Playwright smoke tests (online/offline, IndexedDB sync, SIP parity).
- Contract/API: Add shared fixtures + Vitest suites covering MFapi + AMFI schema drift. See `TESTING.md` for the living automation matrix referenced by README.

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

## UI/UX Development Standards

### Component Architecture

**Atomic Design Hierarchy**
1. **Atoms**: Button, Input, Badge, Spinner, Icon
2. **Molecules**: SearchBar, FilterChip, MetricCard, ToastNotification
3. **Organisms**: FundCard, NAVChart, FilterPanel, ComparisonTable
4. **Templates**: FundsListTemplate, FundDetailTemplate, PortfolioTemplate
5. **Pages**: Home, Funds, Fund Detail, Portfolio, SIP Calculator

**File Structure for New Components**
```
components/
  feature-name/
    ComponentName.tsx        # Component logic
    ComponentName.module.css # Scoped styles
    ComponentName.test.tsx   # Unit tests
    index.ts                 # Clean exports
```

### Loading & Empty States

**Skeleton Loaders** (preferred over spinners)
```tsx
"use client";

export function FundCardSkeleton() {
  return (
    <div className={styles.skeleton} aria-busy="true" aria-label="Loading fund">
      <div className={styles.skeletonCode} />
      <div className={styles.skeletonTitle} />
      <div className={styles.skeletonMeta} />
    </div>
  );
}

// CSS: pulse animation
.skeleton {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
```

**Empty States**
```tsx
export function EmptyState({ 
  icon, 
  title, 
  description, 
  action 
}: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      {icon}
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
```

### Accessibility Requirements

**Mandatory Attributes**
- All buttons: `aria-label` or visible text
- Form inputs: Associated `<label>` with `htmlFor`
- Interactive elements: `role`, `aria-*` as needed
- Dynamic content: `aria-live="polite"` or `"assertive"`
- Focus visible: `:focus-visible` styles (not just `:focus`)

**Keyboard Navigation**
- `Tab`: Focus next/previous element
- `Enter/Space`: Activate button/link
- `Escape`: Close modal/dialog
- `Arrow keys`: Navigate lists/menus

**Example: Accessible Modal**
```tsx
"use client";

import { useEffect, useRef } from "react";

export function Modal({ isOpen, onClose, children }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.focus();
      // Trap focus within modal
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className={styles.backdrop} 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        ref={dialogRef}
        className={styles.dialog} 
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>
  );
}
```

### Color & Theme Standards

**CSS Custom Properties** (in `globals.css`)
```css
:root {
  /* Primary palette */
  --primary: #2563eb;
  --primary-hover: #1d4ed8;
  --primary-active: #1e40af;
  
  /* Semantic colors */
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #3b82f6;
  
  /* Neutrals */
  --foreground: #171717;
  --background: #ffffff;
  --muted: rgba(23, 23, 23, 0.65);
  --border: rgba(23, 23, 23, 0.12);
  --card-bg: rgba(255, 255, 255, 0.65);
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground: #ededed;
    --background: #0a0a0a;
    --muted: rgba(237, 237, 237, 0.75);
    --border: rgba(237, 237, 237, 0.2);
    --card-bg: rgba(15, 15, 15, 0.85);
  }
}
```

**Usage in Components**
```tsx
// Use CSS variables for all colors
<div className={styles.card} style={{ borderColor: 'var(--border)' }}>
  <button className={styles.primaryButton}>
    Action
  </button>
</div>
```

### Responsive Design

**Breakpoints** (mobile-first)
- `sm`: 640px (large phones)
- `md`: 768px (tablets)
- `lg`: 1024px (laptops)
- `xl`: 1280px (desktops)
- `2xl`: 1536px (large desktops)

**Example: Responsive Grid**
```css
.grid {
  display: grid;
  gap: 16px;
  grid-template-columns: 1fr; /* Mobile: single column */
}

@media (min-width: 640px) {
  .grid {
    grid-template-columns: repeat(2, 1fr); /* Tablet: 2 columns */
  }
}

@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(3, 1fr); /* Desktop: 3 columns */
  }
}
```

### Performance Optimizations

**Image Optimization**
- Use Next.js `<Image>` component with `priority` for above-fold images
- Always specify `width` and `height` to prevent layout shift
- Use `loading="lazy"` for below-fold images
- Prefer WebP format with fallback

**Code Splitting**
- Use dynamic imports for heavy components
- Lazy load routes not in critical path
- Split large chart libraries

```tsx
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(
  () => import('@/components/charts/HeavyChart'),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
```

**Bundle Size Monitoring**
- Keep initial JS bundle <200KB
- Monitor with `npm run build` output
- Use webpack-bundle-analyzer if needed

### Error Handling

**Pattern: Error Boundaries**
```tsx
"use client";

import { Component, ReactNode } from 'react';

export class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.error}>
          <h2>Something went wrong</h2>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

### Animation Guidelines

**Use Cases for Animation**
- Loading states: skeleton pulse, spinner rotation
- State transitions: toast slide-in, modal fade-in
- Micro-interactions: button hover, card lift
- Data visualization: chart transitions

**Performance Considerations**
- Use `transform` and `opacity` (GPU-accelerated)
- Avoid animating `width`, `height`, `top`, `left`
- Respect `prefers-reduced-motion`

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Submission Checklist

Before finishing a change, Copilot should ensure:
1. Code respects architecture + compliance rules above.
2. Disclaimers present on any UI surface showing returns.
3. Tests or fixtures updated for new logic.
4. Docs (`Quick-Start-Guide`, ADRs) patched if behavior changes.
5. ESLint/Prettier + type checks pass locally (`turbo lint type-check`).
6. Related automation notes updated in `TESTING.md` when adding/removing suites.
7. **UI/UX changes include:**
   - Accessibility attributes (ARIA, semantic HTML)
   - Loading/empty/error states
   - Mobile responsiveness verification
   - Dark mode compatibility
   - SEBI disclaimer where applicable

Keep contributions consistent with `AGENTS.md` and `CLAUDE.md`. When uncertain, prefer conservative defaults and leave TODO comments referencing the source doc section.
````
