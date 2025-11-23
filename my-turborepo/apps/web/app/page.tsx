"use client";

import { useEffect, useMemo, useState } from "react";

import styles from "./page.module.css";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

type FundPreview = {
  schemeCode: string;
  schemeName: string;
  fundHouse?: string | null;
  schemeCategory?: string | null;
  schemeType?: string | null;
};

type FundsResponse = {
  success: boolean;
  funds?: FundPreview[];
  disclaimer?: string;
  fetchedAt?: string;
  source?: string;
  error?: string;
};

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

const SEBI_DISCLAIMER =
  "Mutual fund investments are subject to market risks. Read all scheme related documents carefully. Historical performance is not an indicator of future returns.";

function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator === "undefined" ? true : navigator.onLine
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    function handleOnline() {
      setIsOnline(true);
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

function useFundPreview(limit = 6) {
  const [state, setState] = useState<{
    loading: boolean;
    error?: string;
    funds: FundPreview[];
    fetchedAt?: string;
    disclaimer?: string;
    source?: string;
  }>({
    loading: true,
    funds: []
  });

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function load() {
      setState((prev) => ({ ...prev, loading: true, error: undefined }));
      try {
        const response = await fetch(`${API_BASE_URL}/api/funds?limit=${limit}`, {
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }

        const payload = (await response.json()) as FundsResponse;
        if (!isMounted) {
          return;
        }

        setState({
          loading: false,
          funds: payload.funds ?? [],
          fetchedAt: payload.fetchedAt,
          disclaimer: payload.disclaimer,
          source: payload.source ?? "MFapi.in",
          error: payload.success ? undefined : payload.error ?? "Unable to fetch funds"
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }
        const message = error instanceof Error ? error.message : "Unable to reach API";
        setState((prev) => ({ ...prev, loading: false, error: message }));
      }
    }

    load();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [limit]);

  return state;
}

export default function Home() {
  const isOnline = useOnlineStatus();
  const { funds, loading, error, fetchedAt, disclaimer, source } = useFundPreview(6);

  const fundList = funds.length ? funds : SAMPLE_FUNDS;
  const formattedTimestamp = useMemo(() => {
    if (!fetchedAt) {
      return undefined;
    }
    try {
      return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(new Date(fetchedAt));
    } catch {
      return fetchedAt;
    }
  }, [fetchedAt]);

  const healthState = loading ? "Validating" : error ? "Degraded" : "Healthy";

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
              <a href="https://www.mfapi.in/" className={styles.primaryAction} target="_blank" rel="noreferrer">
                View MFapi Source
              </a>
              <a
                href="https://github.com/iAn-P1nt0/mf-data-pwa/blob/main/Quick-Start-Guide.md"
                className={styles.secondaryAction}
                target="_blank"
                rel="noreferrer"
              >
                Quick start guide
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
              <p className={styles.statMeta}>IndexedDB wiring TODO</p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Next milestone</p>
              <p className={styles.statValue}>Dexie Cache</p>
              <p className={styles.statMeta}>Then SIP parity</p>
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
            <p>
              Service worker + manifest landing right after this shell. Pre-cache core routes and fund summaries to
              survive Render cold starts.
            </p>
          </article>
          <article className={styles.statusCard}>
            <p className={styles.eyebrow}>IndexedDB</p>
            <h2>Dexie store planned</h2>
            <p>
              Dexie-powered caches will pin the latest fund list + NAV windows locally. This placeholder keeps TODOs
              visible until the store is wired.
            </p>
          </article>
          <article className={styles.statusCard}>
            <p className={styles.eyebrow}>SIP tooling</p>
            <h2>Parity with backend formula</h2>
            <p>
              SIP UI will call the validated `/api/portfolio/sip-calculator` endpoint to ensure client/server parity
              and embed compliance notes next to projections.
            </p>
          </article>
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
          <p className={styles.metaLine}>
            Source: {source ?? "MFapi.in"}
            {formattedTimestamp ? ` · Last refreshed ${formattedTimestamp}` : ""}
            {error ? ` · ${error}` : ""}
          </p>
        </section>

        <section className={styles.todoSection}>
          <p className={styles.eyebrow}>Up next</p>
          <h2>Immediate engineering TODOs</h2>
          <ul>
            <li>✅ Backend NAV filter + Vitest harness are already merged.</li>
            <li>🚧 Wire Dexie stores for `funds`, `navHistory`, and `portfolio` slices.</li>
            <li>🚧 Adopt React Query (or RTK Query) for stale-while-revalidate fetches.</li>
            <li>🚧 Ship SIP calculator UI with server parity + SEBI disclaimer surface.</li>
          </ul>
        </section>

        <section className={styles.disclaimerCard}>
          <h2>Compliance first</h2>
          <p>{disclaimer ?? SEBI_DISCLAIMER}</p>
        </section>
      </div>
    </div>
  );
}
