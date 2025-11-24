"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import styles from "./page.module.css";
import { useFundPreview } from "@/hooks/useFundPreview";
import { useNavHistory } from "@/hooks/useNavHistory";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { usePortfolioStore } from "@/hooks/usePortfolioStore";
import { API_BASE_URL, SEBI_DISCLAIMER } from "@/lib/config";
import type { FundPreview } from "@/lib/types";
import { Sparkline } from "@/components/charts/Sparkline";

const SAMPLE_FUNDS: FundPreview[] = [
  {
    schemeCode: "118834",
    schemeName: "HDFC Flexi Cap Fund",
    fundHouse: "HDFC Mutual Fund",
    schemeCategory: "Flexi Cap",
    schemeType: "Open Ended"
  },
  {
    schemeCode: "120503",
    schemeName: "Mirae Asset Large Cap Fund",
    fundHouse: "Mirae Asset Mutual Fund",
    schemeCategory: "Large Cap",
    schemeType: "Open Ended"
  },
  {
    schemeCode: "125354",
    schemeName: "Kotak Corporate Bond Fund",
    fundHouse: "Kotak Mahindra Mutual Fund",
    schemeCategory: "Corporate Bond",
    schemeType: "Debt"
  },
  {
    schemeCode: "118550",
    schemeName: "Axis Long Term Equity Fund",
    fundHouse: "Axis Mutual Fund",
    schemeCategory: "ELSS",
    schemeType: "Tax Saving"
  }
];

export default function Home() {
  const isOnline = useOnlineStatus();
  const { funds, isLoading, error, fetchedAt, disclaimer, source, usedCacheFallback } = useFundPreview(6);
  const fundList = funds.length ? funds : SAMPLE_FUNDS;
  const spotlightFund = fundList[0];

  // Initialize with static dates to avoid hydration mismatch, then update on client
  const [dateRange, setDateRange] = useState({
    startDate: '2025-10-24',  // Will be overwritten client-side
    endDate: '2025-11-23'      // Will be overwritten client-side
  });

  useEffect(() => {
    // Calculate actual dates only on the client after hydration
    const end = new Date();
    const start = daysAgo(30);
    setDateRange({
      startDate: toIsoDate(start),
      endDate: toIsoDate(end)
    });
  }, []);

  const { startDate, endDate } = dateRange;
  const {
    points: navPoints,
    isLoading: navLoading,
    error: navError
  } = useNavHistory({ schemeCode: spotlightFund?.schemeCode, startDate, endDate });

  const navStats = useMemo(() => summarizeNav(navPoints), [navPoints]);
  const { summary: portfolioSummary } = usePortfolioStore();

  const healthState = isLoading ? "Validating" : error ? "Degraded" : "Healthy";

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.hero}>
          <div>
            <p className={styles.badge}>Phase 2 · Frontend MVP</p>
            <h1>India Mutual Funds Data PWA</h1>
            <p>
              Live NAV intelligence with SEBI-compliant messaging, built for offline-first usage
              so retail investors can trust the data even when Render cold starts.
            </p>
            <div className={styles.heroActions}>
              <Link href="/funds" className={styles.primaryAction}>
                Fund Analysis
              </Link>
              <Link href="/visualizations" className={styles.secondaryAction}>
                Advanced Visualizations
              </Link>
              <Link href="/api-explorer" className={styles.secondaryAction}>
                API Explorer
              </Link>
              <Link href="/tools/sip" className={styles.secondaryAction}>
                SIP toolkit
              </Link>
              <a href="https://www.mfapi.in/" className={styles.secondaryAction} target="_blank" rel="noreferrer">
                View MFapi Source
              </a>
            </div>
          </div>
          <div className={styles.statGrid}>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>API Health</p>
              <p className={styles.statValue}>{healthState}</p>
              <p className={styles.statMeta}>{isOnline ? "Online" : "Offline"} client</p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Live Funds Cached</p>
              <p className={styles.statValue}>{fundList.length}</p>
              <p className={styles.statMeta}>{usedCacheFallback ? "Serving cached data" : "Fresh pull"}</p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Next milestone</p>
              <p className={styles.statValue}>Offline vault</p>
              <p className={styles.statMeta}>{portfolioSummary.totalHoldings} schemes tracked</p>
            </div>
          </div>
        </header>

        {!isOnline && (
          <section className={styles.offlineBanner} aria-live="polite">
            <strong>Offline mode:</strong> Showing cached fund snapshot. NAV data will refresh automatically once
            you are back online.
          </section>
        )}

        <section className={styles.statusGrid}>
          <article className={styles.statusCard}>
            <p className={styles.eyebrow}>Service Worker</p>
            <h2>Bootstrap shell arrives under 1s</h2>
            <p>Service worker + manifest now pin the app shell and manifest for offline-first launches.</p>
          </article>
          <article className={styles.statusCard}>
            <p className={styles.eyebrow}>IndexedDB</p>
            <h2>Dexie cache live</h2>
            <p>Funds + NAV windows hydrate from IndexedDB instantly, then refresh in the background when online.</p>
          </article>
          <article className={styles.statusCard}>
            <p className={styles.eyebrow}>SIP tooling</p>
            <h2>Parity with backend formula</h2>
            <p>
              SIP UI calls the server when available and gracefully falls back to the validated client formula, keeping
              compliance front-and-center.
            </p>
          </article>
        </section>

        <section className={styles.navSection}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>NAV insight</p>
              <h2>{spotlightFund?.schemeName ?? "Fund spotlight"}</h2>
            </div>
            <p className={styles.sectionHint}>Last 30 days · {spotlightFund?.schemeCode ?? "N/A"}</p>
          </div>
          <div className={styles.navGrid}>
            <div className={styles.navSummary}>
              <p className={styles.navLabel}>Latest NAV</p>
              <p className={styles.navPrimary}>{navStats.lastNav ?? "--"}</p>
              <p className={styles.navChange} data-positive={(navStats.change ?? 0) >= 0}>
                {navLoading ? "Syncing" : formatChange(navStats.change)} (30d)
              </p>
              {navError && <p className={styles.metaLine}>NAV cache in use: {navError}</p>}
            </div>
            <div className={styles.sparkline}>
              <Sparkline points={navPoints.map((point) => ({ date: point.date, nav: Number(point.nav) }))} />
              <ul className={styles.navList}>
                {(navPoints ?? []).slice(-6).reverse().map((point) => (
                  <li key={`${point.date}-${point.nav}`}>
                    <span>{point.date}</span>
                    <span className={styles.navValue}>{Number(point.nav).toFixed(3)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className={styles.fundSection}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Live fund snapshot</p>
              <h2>Server-validated data with offline fallbacks</h2>
            </div>
            <div className={styles.sectionActions}>
              <a
                href={`${API_BASE_URL}/api/funds?limit=10`}
                className={styles.sectionLink}
                target="_blank"
                rel="noreferrer"
              >
                Try `/api/funds`
              </a>
              <a
                href="https://github.com/iAn-P1nt0/mf-data-pwa/blob/main/TESTING.md"
                className={styles.sectionLink}
                target="_blank"
                rel="noreferrer"
              >
                View test matrix
              </a>
            </div>
          </div>
          <div className={styles.fundGrid}>
            {fundList.map((fund) => (
              <article key={fund.schemeCode} className={styles.fundCard}>
                <p className={styles.fundCode}>{fund.schemeCode}</p>
                <h3>{fund.schemeName}</h3>
                <p className={styles.fundMeta}>
                  {fund.schemeCategory ?? "Category TBD"} · {fund.schemeType ?? "Type TBD"}
                </p>
                <p className={styles.fundHouse}>{fund.fundHouse ?? "House TBD"}</p>
              </article>
            ))}
          </div>
          <p className={styles.metaLine} suppressHydrationWarning>
            Source: {source ?? "MFapi.in"}
            {fetchedAt ? ` · Last refreshed ${fetchedAt}` : ""}
            {error ? ` · ${error}` : ""}
          </p>
        </section>

        <section className={styles.todoSection}>
          <p className={styles.eyebrow}>Up next</p>
          <h2>Immediate engineering TODOs</h2>
          <ul>
            <li>✅ Backend NAV filter + Vitest harness are already merged.</li>
            <li>✅ Dexie stores power `funds`, `navHistory`, and now `portfolio` caches.</li>
            <li>✅ React Query orchestrates stale-while-revalidate flows.</li>
            <li>🚧 CAS import + alerts remain on the roadmap.</li>
            <li>🚧 Background sync optimizations will mature the PWA story.</li>
          </ul>
        </section>

        <section className={styles.portfolioSection}>
          <div>
            <p className={styles.eyebrow}>Portfolio snapshot</p>
            <h2>Client-side holdings stay private</h2>
            <p>
              {portfolioSummary.totalHoldings
                ? `Tracking ${portfolioSummary.totalHoldings} scheme(s) · ₹${portfolioSummary.totalInvested.toFixed(2)} invested across ${portfolioSummary.totalUnits.toFixed(2)} units.`
                : "Start capturing your SIPs with offline storage."}
            </p>
          </div>
          <div className={styles.portfolioStats}>
            <div>
              <p>Total invested</p>
              <strong>₹{portfolioSummary.totalInvested.toFixed(2)}</strong>
            </div>
            <div>
              <p>Average cost</p>
              <strong>₹{portfolioSummary.averageCost.toFixed(2)}</strong>
            </div>
            <div>
              <p>Total units</p>
              <strong>{portfolioSummary.totalUnits.toFixed(2)}</strong>
            </div>
          </div>
          <Link href="/tools/portfolio" className={styles.sectionLink}>
            Open offline vault
          </Link>
        </section>

        <section className={styles.disclaimerCard}>
          <h2>Compliance first</h2>
          <p>{disclaimer ?? SEBI_DISCLAIMER}</p>
        </section>
      </div>
    </div>
  );
}

function daysAgo(count: number) {
  const date = new Date();
  date.setDate(date.getDate() - count);
  return date;
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function summarizeNav(points: { date: string; nav: number }[]) {
  if (!points?.length) {
    return { lastNav: undefined, change: undefined };
  }
  const sorted = [...points].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const first = sorted.at(0);
  const last = sorted.at(-1);
  return {
    lastNav: last ? last.nav.toFixed(3) : undefined,
    change: first && last ? last.nav - first.nav : undefined
  };
}

function formatChange(delta?: number) {
  if (typeof delta !== "number") {
    return "--";
  }
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toFixed(3)}`;
}
