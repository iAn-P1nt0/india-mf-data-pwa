"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { API_BASE_URL, SEBI_DISCLAIMER } from "@/lib/config";
import { readFundsSnapshot, storeFundsSnapshot } from "@/lib/cache-db";
import type { FundPreview, FundsResponse } from "@/lib/types";

export function useFundPreview(limit = 6) {
  const [cachedFunds, setCachedFunds] = useState<FundPreview[]>([]);
  const [cachedMeta, setCachedMeta] = useState<Record<string, unknown>>();

  useEffect(() => {
    let active = true;
    readFundsSnapshot(limit).then((snapshot) => {
      if (!active) return;
      setCachedFunds(snapshot.funds);
      setCachedMeta(snapshot.meta as Record<string, unknown> | undefined);
    });
    return () => {
      active = false;
    };
  }, [limit]);

  const query = useQuery({
    queryKey: ["funds", limit],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/funds?limit=${limit}`);
      if (!response.ok) {
        throw new Error(`Funds API responded with ${response.status}`);
      }
      const data = (await response.json()) as FundsResponse;
      if (!data.success) {
        throw new Error(data.error ?? "Unable to fetch funds");
      }
      return data;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60 * 6,
    retry: 1,
    refetchOnWindowFocus: false
  });

  useEffect(() => {
    if (!query.data) {
      return;
    }
    storeFundsSnapshot(query.data);
  }, [query.data]);

  const funds = query.data?.funds ?? cachedFunds;
  const disclaimer = (query.data?.disclaimer ?? cachedMeta?.disclaimer) as string | undefined;
  const fetchedAt = (query.data?.fetchedAt ?? cachedMeta?.fetchedAt) as string | undefined;
  const source = (query.data?.source ?? cachedMeta?.source) as string | undefined;

  const formattedTimestamp = useMemo(() => {
    if (!fetchedAt) {
      return undefined;
    }
    try {
      return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Kolkata"
      }).format(new Date(fetchedAt));
    } catch {
      return fetchedAt;
    }
  }, [fetchedAt]);

  return {
    funds,
    disclaimer: disclaimer ?? SEBI_DISCLAIMER,
    fetchedAt: formattedTimestamp,
    source: source ?? "MFapi.in",
    isLoading: query.isLoading && !cachedFunds.length,
    isFetching: query.isFetching,
    error: query.error instanceof Error ? query.error.message : undefined,
    usedCacheFallback: !query.data && cachedFunds.length > 0
  };
}
