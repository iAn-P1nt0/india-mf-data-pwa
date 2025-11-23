# Frontend Deployment Architecture

This guide describes the production-ready deployment plan for the India Mutual Funds Data PWA frontend (`my-turborepo/apps/web`). It aligns with the compliance, offline-first, and high-availability guardrails defined in `AGENTS.md`, `CLAUDE.md`, and `Technical-FAQ-Decisions.md`.

---

## 1. Objectives & Constraints

1. **Compliance first** – Every deployment must preserve SEBI disclaimer delivery (`SEBI_DISCLAIMER` in `apps/web/lib/config.ts`) across all routes.
2. **Offline-first UX** – `public/sw.js`, the Dexie-backed caches in `apps/web/lib/cache-db.ts`, and React Query hooks must keep the shell usable while Render (API host) cold starts.
3. **Latency budget** – Target <2.5s LCP on median Android, and <300ms API latency for cached `/api/funds` calls (see `CLAUDE.md`, Section 3).
4. **Separation of concerns** – Frontend stays on Vercel Edge, backend remains on Render (per `render.yaml`). No mixed hosting to avoid cascading cold starts.
5. **Observability & rollback** – Deployment pipeline must surface Vitest (`npm run test --workspace web`) and lint/type failures before promotion. Rollbacks should be one-click via Vercel UI or CLI.

### 1.1 Deployment Inputs (fill before proceeding)

| Parameter | Description | Your Value |
|-----------|-------------|------------|
| Vercel project name | As shown in Vercel dashboard (`Settings → General`). | *(enter here)* |
| Vercel team/org | Team slug if using a shared account; leave blank for personal. | *(enter here)* |
| Production domain | e.g., `mf-data.iap.dev`. Needed for DNS + HTTPS. | *(enter here)* |
| Preview domain pattern | Usually `*.vercel.app`; confirm custom aliases if any. | *(enter here)* |
| NEXT_PUBLIC_API_BASE_URL | Render API HTTPS base URL (ex: `https://india-mf-data-pwa.onrender.com`). | *(enter here)* |
| Render API service name | Needed for cold-start pings / monitoring. | *(enter here)* |
| Contact email / on-call | Who receives Vercel/Renda alerts. | *(enter here)* |
| Additional secrets | List any other env vars (analytics, Sentry DSN, etc.). | *(enter here)* |

Populate this table with real values before running the pipeline or requesting credentials from maintainers. It doubles as a checklist when rotating secrets.

---

## 2. Target Topology

```
Browser (PWA) ──HTTPS──► Vercel Edge/CDN ──SSR/API proxy──► Next.js app (`apps/web`)
                                            │
                                            └──HTTPS──► Render API (`API_BASE_URL`)
```

- **Static assets** (service worker, manifest, fonts) are cached at the CDN edge with immutable headers.
- **Dynamic pages** (Next.js Server Components) leverage Vercel’s Node 18 runtime; React Query handles client hydration.
- **API calls** go directly to Render (`https://india-mf-data-pwa.onrender.com`) via `NEXT_PUBLIC_API_BASE_URL`; CORS already enforced server-side.

---

## 3. Environment Layout

| Stage   | Vercel Branch | Domain                              | Notes |
|---------|----------------|-------------------------------------|-------|
| Dev     | feature/*      | `dev-mf-data.vercel.app`            | Turborepo dev server; SW disabled via Next dev mode. |
| Preview | Pull Request   | `pr-###.mf-data.vercel.app`         | Automatic per PR; share with reviewers for UI + compliance checks. |
| Prod    | `main`         | `mf-data.iap.dev` (custom) + fallback `mf-data.vercel.app` | Connect to Route53/Cloudflare DNS; enforce HTTPS, HTTP/3. |

Secrets per stage:
- `NEXT_PUBLIC_API_BASE_URL`: `https://india-mf-data-pwa.onrender.com` (prod) / Render staging URL (preview).
- `NEXT_TELEMETRY_DISABLED=1` to avoid noisy logs.
- Render service env: `CORS_ALLOWED_ORIGINS=https://india-mf-data-pwa.vercel.app,https://*.vercel.app` so browser fetches are accepted.

---

## 4. Build & Release Pipeline

1. **Install dependencies**
   ```bash
   npm install
   npm run check-types --workspace web
   npm run lint --workspace web
   npm run test --workspace web
   ```
2. **Build**
   ```bash
   npm run build --workspace web
   ```
   - Ensures `public/manifest.webmanifest` and `public/sw.js` are present in `.next` output.
3. **Artifact validation**
   - Confirm `app/providers.tsx` injects `<ServiceWorkerRegister />` only in production to avoid dev noise.
   - Ensure `next.config.js` exposes `NEXT_PUBLIC_API_BASE_URL` for client hydration.
4. **Upload to Vercel** via GitHub integration or `vercel --prod`. The Turborepo root stays connected; Vercel project is scoped to `apps/web` using the `rootDirectory` setting.
5. **Post-deploy smoke**
   - Run `npx playwright test tests/pwa-smoke.spec.ts` (future) or manual checklist: open `/`, `/tools/sip`, `/tools/portfolio`, toggle offline mode.

---

## 5. GitHub Actions (Recommended)

Create `.github/workflows/web-ci.yml` that triggers on PRs touching `apps/web/**` or shared packages:

```yaml
name: web-ci
on:
  pull_request:
    paths:
      - "my-turborepo/apps/web/**"
      - "my-turborepo/packages/**"
      - "turbo.json"
  push:
    branches: [main]

jobs:
  test-web:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: my-turborepo
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm install
      - run: npm run lint --workspace web
      - run: npm run check-types --workspace web
      - run: npm run test --workspace web
```

- The workflow mirrors the local pipeline and blocks merges/deploys if Vitest fails.
- Add a status badge to `README.md` once the workflow lands.

---

## 6. Vercel Project Configuration Steps

1. **Create Project** – Import repo, pick `my-turborepo` root.
2. **Set Root Directory** – `my-turborepo/apps/web`.
3. **Framework Preset** – Next.js (App Router, Node 18).
4. **Build Command** – `npm run build` (Vercel auto-adds `--workspace web` when root dir set).
5. **Output Directory** – `.next`.
6. **Install Command** – `npm install` (runs at repo root). Use PNPM if future switch.
7. **Env Vars** – Add `NEXT_PUBLIC_API_BASE_URL`, `NEXT_TELEMETRY_DISABLED`.
8. **Edge Functions** – Keep default; upgrade to Edge Runtime later for `/api/*` proxies if needed.
9. **Domains** – Map `mf-data.iap.dev` (apex + www) via CNAME to Vercel.
10. **Branch Protection** – Configure Vercel to only deploy `main` to production; previews use PR branches.

---

## 7. Runtime Guardrails

- **Service Worker Prefetch** (`components/pwa/ServiceWorkerRegister.tsx`) sends `{ type: "prefetch", payload: [url] }`. Ensure Vercel caches `/sw.js` with `Cache-Control: public, max-age=0, must-revalidate` so updates propagate.
- **Response headers** – Add `next.config.js` rewrites to provide `Cross-Origin-Resource-Policy: same-origin` for Dexie dumps; prevents data bleed.
- **Monitoring** – Enable Vercel Analytics + Speed Insights; mirror logs into LogDNA or Datadog if required.
- **Rollbacks** – Use `vercel rollback <deployment-id>` or promote last good deployment from dashboard.

---

## 8. Disaster Recovery & Fallbacks

1. **Vercel outage** – Deploy static export to Cloudflare Pages using `next export` + `@vercel/og` fallback. Documented runbook should live in `docs/DR.md` (TODO).
2. **Render outage** – Service worker serves cached responses; highlight offline banner (`app/page.tsx`, `useOnlineStatus`). Optionally add fallback API on Vercel Edge using caching worker.
3. **Secret rotation** – Rotate `NEXT_PUBLIC_API_BASE_URL` when backend URL changes; propagate via Vercel’s environment promotion (dev → preview → prod) to avoid broken fetches.

---

## 9. Pending Enhancements

- Add Playwright smoke tests (offline + install prompt) tied into CI before deployment.
- Publish `docs/DR.md` and `docs/OPERATIONS.md` to capture on-call runbooks.
- Consider Vercel Cron to warm Render API every 15 minutes if free-tier cold starts hurt UX.

---

**Next Actions**
1. Set up Vercel project per Section 6.
2. Add GitHub Actions workflow from Section 5.
3. Link this document from `README.md` and `Quick-Start-Guide.md` so contributors follow the same deployment path.
