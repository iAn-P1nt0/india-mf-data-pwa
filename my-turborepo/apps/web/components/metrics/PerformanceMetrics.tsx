"use client";

import { useMemo } from "react";
import styles from "./PerformanceMetrics.module.css";

type NavPoint = {
  date: string;
  nav: number;
};

interface PerformanceMetricsProps {
  navPoints: NavPoint[];
  schemeName?: string;
}

export function PerformanceMetrics({ navPoints, schemeName }: PerformanceMetricsProps) {
  const metrics = useMemo(() => {
    if (!navPoints || navPoints.length < 2) {
      return null;
    }

    const sorted = [...navPoints].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const firstNav = sorted[0].nav;
    const lastNav = sorted[sorted.length - 1].nav;
    const highNav = Math.max(...sorted.map((p) => p.nav));
    const lowNav = Math.min(...sorted.map((p) => p.nav));

    // Calculate returns
    const absoluteReturn = lastNav - firstNav;
    const percentReturn = ((lastNav - firstNav) / firstNav) * 100;

    // Calculate CAGR (approximate based on days)
    const daysDiff = (new Date(sorted[sorted.length - 1].date).getTime() - new Date(sorted[0].date).getTime()) / (1000 * 60 * 60 * 24);
    const years = daysDiff / 365;
    const cagr = years > 0 ? (Math.pow(lastNav / firstNav, 1 / years) - 1) * 100 : 0;

    // Calculate volatility (standard deviation of daily returns)
    const returns = sorted.slice(1).map((point, i) => (point.nav - sorted[i].nav) / sorted[i].nav);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance) * Math.sqrt(252) * 100; // Annualized

    return {
      firstNav,
      lastNav,
      highNav,
      lowNav,
      absoluteReturn,
      percentReturn,
      cagr,
      volatility,
      dataPoints: sorted.length,
      dateRange: `${sorted[0].date} to ${sorted[sorted.length - 1].date}`,
    };
  }, [navPoints]);

  if (!metrics) {
    return (
      <div className={styles.empty}>
        <p>Insufficient data for performance metrics</p>
      </div>
    );
  }

  const isPositive = metrics.percentReturn >= 0;

  return (
    <div className={styles.container}>
      {schemeName && <h3 className={styles.title}>Performance Metrics</h3>}

      <div className={styles.grid}>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Current NAV</div>
          <div className={styles.metricValue}>₹{metrics.lastNav.toFixed(4)}</div>
          <div className={styles.metricChange} data-positive={isPositive}>
            {isPositive ? "+" : ""}
            {metrics.absoluteReturn.toFixed(4)} ({metrics.percentReturn.toFixed(2)}%)
          </div>
        </div>

        <div className={styles.metric}>
          <div className={styles.metricLabel}>CAGR</div>
          <div className={styles.metricValue} data-positive={metrics.cagr >= 0}>
            {metrics.cagr >= 0 ? "+" : ""}
            {metrics.cagr.toFixed(2)}%
          </div>
          <div className={styles.metricHint}>Compounded Annual Growth Rate</div>
        </div>

        <div className={styles.metric}>
          <div className={styles.metricLabel}>Volatility</div>
          <div className={styles.metricValue}>{metrics.volatility.toFixed(2)}%</div>
          <div className={styles.metricHint}>Annualized</div>
        </div>

        <div className={styles.metric}>
          <div className={styles.metricLabel}>Highest NAV</div>
          <div className={styles.metricValue}>₹{metrics.highNav.toFixed(4)}</div>
          <div className={styles.metricHint}>In period</div>
        </div>

        <div className={styles.metric}>
          <div className={styles.metricLabel}>Lowest NAV</div>
          <div className={styles.metricValue}>₹{metrics.lowNav.toFixed(4)}</div>
          <div className={styles.metricHint}>In period</div>
        </div>

        <div className={styles.metric}>
          <div className={styles.metricLabel}>Data Points</div>
          <div className={styles.metricValue}>{metrics.dataPoints}</div>
          <div className={styles.metricHint}>NAV records</div>
        </div>
      </div>

      <div className={styles.disclaimer}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M8 4V8M8 11V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <p>
          Historical returns do not guarantee future performance. CAGR and volatility calculations are
          approximate based on available data points. This is not investment advice.
        </p>
      </div>
    </div>
  );
}
