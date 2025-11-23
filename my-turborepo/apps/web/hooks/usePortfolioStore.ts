"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  deletePortfolioHolding,
  listPortfolioHoldings,
  summarizeHoldings,
  upsertPortfolioHolding
} from "@/lib/cache-db";
import type { PortfolioHolding, PortfolioSummary } from "@/lib/types";

const DEFAULT_SUMMARY: PortfolioSummary = {
  totalHoldings: 0,
  totalUnits: 0,
  totalInvested: 0,
  averageCost: 0
};

export function usePortfolioStore() {
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const rows = await listPortfolioHoldings();
      setHoldings(rows);
      setError(undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load holdings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const summary = useMemo(() => summarizeHoldings(holdings), [holdings]);

  const addOrUpdate = useCallback(
    async (payload: Omit<PortfolioHolding, "id" | "createdAt" | "updatedAt">) => {
      await upsertPortfolioHolding(payload);
      await refresh();
    },
    [refresh]
  );

  const remove = useCallback(
    async (schemeCode: string) => {
      await deletePortfolioHolding(schemeCode);
      await refresh();
    },
    [refresh]
  );

  return {
    holdings,
    summary: summary ?? DEFAULT_SUMMARY,
    loading,
    error,
    addOrUpdate,
    remove,
    refresh
  };
}
