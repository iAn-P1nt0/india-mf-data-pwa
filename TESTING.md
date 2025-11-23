# TESTING.md - Automation Plan

This file tracks the living automated-test architecture for India MF Data PWA. Keep it current whenever suites are added or re-scoped.

## 1. Backend (apps/api)

| Layer | Tooling | Scope |
|-------|---------|-------|
| Unit | Vitest | Pure helpers (`services/mfapi.ts`, date parsing, AMFI normalization) with mocked fetch/Prisma. |
| Route/Integration | Vitest + Supertest | `/api/health`, `/api/funds`, `/api/funds/:schemeCode`, `/api/funds/:schemeCode/nav` (happy + invalid ranges + MFapi failures). |
| Data Jobs | Vitest (fixtures) | `scripts/amfi-sync.ts` parser + batching pipeline using sampled `NAVAll` snapshots. Contract tests guard against AMFI format drift. |
| Contract/API | Vitest | Snapshot MFapi + AMFI schema payloads; alert when upstream fields disappear or change casing. |

**Expectations**
- Every new endpoint ships with Vitest + Supertest coverage (2xx + 4xx + upstream-failure paths).
- AMFI ingestion changes require fixture updates + assertions on dedupe/upsert counts.
- Use `vitest.setup.ts` to isolate env vars; never hit Render/Postgres in unit tests.

## 2. Frontend (apps/web)

| Layer | Tooling | Scope |
|-------|---------|-------|
| Unit/UI | Vitest + React Testing Library | Fund list, loading/error/offline banners, disclaimer component, SIP calculator inputs. |
| State | Vitest | Redux slices/RTK Query cache behavior, Dexie adapters (mock IndexedDB). |
| Integration | MSW + RTL | Simulate `/api/funds` responses, cold-start states, search interactions.

**Upcoming sequence (aligned with roadmap)**
1. PWA shell tests once the funds grid lands.
2. IndexedDB caching: Dexie adapter tests ensuring persistence/offline fetch.
3. SIP tooling parity: compare client vs backend formula outputs within tests.

## 3. End-to-End (planned)

| Layer | Tooling | Scope |
|-------|---------|-------|
| PWA Smoke | Playwright | Online/offline toggles, install prompt, funds search, disclaimer visibility. |
| Offline Cache | Playwright + Service Worker mocks | Ensure last NAV snapshot renders when API offline. |
| Accessibility | Playwright + axe | Headline pages meet WCAG AA (focus order, color contrast). |

These suites will turn on once the frontend PWA shell stabilizes. Capture critical flows (fund search, NAV detail, SIP tool) and run in CI nightly.

## 4. CI / Automation Hooks

- **Short term**: GitHub Actions workflow to run `npm run test --workspace=apps/api` and lint/type-check tasks on PRs.
- **Mid term**: Add AMFI fixture contract job (cron) + Playwright smoke job triggered post-deploy.
- **Long term**: Nightly lighthouse + a11y sweeps, render cron verifying AMFI ingestion health.

## 5. Contributor Checklist

Whenever you add or modify functionality:
1. Pick the matching layer(s) above and extend coverage.
2. Update this file if the scope or toolchain changes.
3. Mention the relevant suites in PR descriptions.
4. Ensure README links remain accurate.

Keeping this document current prevents regressions and clarifies expectations for future contributors.
