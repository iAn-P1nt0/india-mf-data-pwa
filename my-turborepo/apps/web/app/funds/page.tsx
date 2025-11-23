"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FundSelector } from "@/components/funds/FundSelector";
import { NAVChart } from "@/components/charts/NAVChart";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import { PerformanceMetrics } from "@/components/metrics/PerformanceMetrics";
import { useFundPreview } from "@/hooks/useFundPreview";
import { useNavHistory } from "@/hooks/useNavHistory";
import type { FundPreview } from "@/lib/types";
import { SEBI_DISCLAIMER } from "@/lib/config";
import styles from "./page.module.css";

export default function FundsAnalysisPage() {
  const { funds, isLoading, disclaimer } = useFundPreview(100);

  const [selectedFund, setSelectedFund] = useState<FundPreview | null>(null);
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string }>(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 90); // Default 3 months
    return {
      startDate: start.toISOString().split("T")[0]!,
      endDate: end.toISOString().split("T")[0]!,
    };
  });

  // Set first fund as default when funds load
  useEffect(() => {
    if (funds.length > 0 && !selectedFund) {
      setSelectedFund(funds[0] ?? null);
    }
  }, [funds, selectedFund]);

  const {
    points: navPoints,
    isLoading: navLoading,
    error: navError,
  } = useNavHistory({
    schemeCode: selectedFund?.schemeCode.toString(),
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const handleDateChange = (startDate: string, endDate: string) => {
    setDateRange({ startDate, endDate });
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <Link href="/" className={styles.backLink}>
              ← Back to Home
            </Link>
            <h1 className={styles.title}>Fund Analysis</h1>
            <p className={styles.subtitle}>
              Search, select, and analyze mutual fund performance with interactive NAV charts and
              comprehensive metrics.
            </p>
          </div>
        </header>

        <section className={styles.selectorSection}>
          <div className={styles.sectionHeader}>
            <h2>Select Fund</h2>
            <p className={styles.sectionHint}>
              {funds.length} funds available • Search by name, code, or category
            </p>
          </div>
          <FundSelector
            funds={funds}
            selectedFund={selectedFund}
            onSelectFund={setSelectedFund}
            isLoading={isLoading}
          />
        </section>

        {selectedFund && (
          <>
            <section className={styles.fundInfo}>
              <div className={styles.fundHeader}>
                <div>
                  <h2 className={styles.fundName}>{selectedFund.schemeName}</h2>
                  <div className={styles.fundMeta}>
                    <span className={styles.fundCode}>Code: {selectedFund.schemeCode}</span>
                    {selectedFund.schemeCategory && (
                      <>
                        <span className={styles.separator}>•</span>
                        <span>{selectedFund.schemeCategory}</span>
                      </>
                    )}
                    {selectedFund.schemeType && (
                      <>
                        <span className={styles.separator}>•</span>
                        <span>{selectedFund.schemeType}</span>
                      </>
                    )}
                    {selectedFund.fundHouse && (
                      <>
                        <span className={styles.separator}>•</span>
                        <span>{selectedFund.fundHouse}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className={styles.dateSection}>
              <div className={styles.sectionHeader}>
                <h2>Date Range</h2>
                <p className={styles.sectionHint}>Select a preset or choose custom dates</p>
              </div>
              <DateRangePicker
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
                onDateChange={handleDateChange}
              />
            </section>

            <section className={styles.chartSection}>
              <div className={styles.sectionHeader}>
                <h2>NAV History</h2>
                <p className={styles.sectionHint}>
                  {navLoading
                    ? "Loading..."
                    : navError
                      ? "Using cached data"
                      : `${navPoints.length} data points`}
                </p>
              </div>
              <NAVChart points={navPoints.map((p) => ({ date: p.date, nav: Number(p.nav) }))} height={400} />
            </section>

            <section className={styles.metricsSection}>
              <PerformanceMetrics
                navPoints={navPoints.map((p) => ({ date: p.date, nav: Number(p.nav) }))}
                schemeName={selectedFund.schemeName}
              />
            </section>
          </>
        )}

        <section className={styles.disclaimer}>
          <div className={styles.disclaimerIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <h3 className={styles.disclaimerTitle}>Important Disclaimer</h3>
            <p className={styles.disclaimerText}>{disclaimer ?? SEBI_DISCLAIMER}</p>
          </div>
        </section>
      </div>
    </div>
  );
}
