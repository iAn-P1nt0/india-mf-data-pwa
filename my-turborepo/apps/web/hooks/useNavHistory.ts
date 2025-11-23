"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { API_BASE_URL, SEBI_DISCLAIMER } from "@/lib/config";
import { readNavHistory, storeNavHistory } from "@/lib/cache-db";
import type { NavHistoryResponse } from "@/lib/types";

export function useNavHistory(params: { schemeCode?: string; startDate?: string; endDate?: string }) {
  const { schemeCode, startDate, endDate } = params;
  const [cached, setCached] = useState<{ date: string; nav: number }[]>([]);

  useEffect(() => {
    let active = true;
    if (!schemeCode) {
      return () => {
        active = false;
      };
    }
    readNavHistory(schemeCode, startDate, endDate).then((rows) => {
      if (!active) return;
      setCached(rows.map((row) => ({ date: row.navDate, nav: row.navValue })));
    });
    return () => {
      active = false;
    };
  }, [schemeCode, startDate, endDate]);

  const query = useQuery({
    queryKey: ["navHistory", schemeCode, startDate, endDate],
    enabled: Boolean(schemeCode),
    queryFn: async () => {
      if (!schemeCode) {
        throw new Error("Scheme code missing");
      }
      const params = new URLSearchParams();
      if (startDate) params.append("start", startDate);
      if (endDate) params.append("end", endDate);
      const response = await fetch(`${API_BASE_URL}/api/funds/${schemeCode}/nav?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`NAV API responded with ${response.status}`);
      }
      const payload = (await response.json()) as NavHistoryResponse;
      return payload;
    },
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 12,
    retry: 1
  });

  useEffect(() => {
    if (!schemeCode || !query.data?.navHistory?.data?.length) {
      return;
    }
    storeNavHistory(schemeCode, query.data.navHistory.data);
  }, [query.data, schemeCode]);

  const points = query.data?.navHistory?.data
    ? normalizePoints(query.data.navHistory.data)
    : cached;

  return {
    points,
    disclaimer: query.data?.disclaimer ?? SEBI_DISCLAIMER,
    isLoading: query.isLoading && !cached.length,
    isFetching: query.isFetching,
    error: query.error instanceof Error ? query.error.message : undefined
  };
}

function normalizePoints(points: { date: string; nav: string | number }[]) {
  return points.map((point) => ({
    date: point.date,
    nav: typeof point.nav === "string" ? Number(point.nav) : point.nav
  }));
}
