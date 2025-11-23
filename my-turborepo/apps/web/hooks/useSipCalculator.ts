"use client";

import { useMemo } from "react";
import { useMutation } from "@tanstack/react-query";

import { API_BASE_URL, SEBI_DISCLAIMER } from "@/lib/config";
import { calculateSipProjection } from "@/lib/sip";
import type { SipInput, SipProjection } from "@/lib/types";

type ApiSipResponse = {
  success: boolean;
  projection: SipProjection;
  disclaimer?: string;
  source?: string;
};

export function useSipCalculator() {
  const mutation = useMutation({
    mutationFn: async (payload: SipInput) => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/portfolio/sip-calculator`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });
        if (response.ok) {
          const data = (await response.json()) as ApiSipResponse;
          if (data.success && data.projection) {
            return {
              projection: data.projection,
              source: data.source ?? "india-mf-data-api",
              disclaimer: data.disclaimer ?? SEBI_DISCLAIMER,
              upstream: true
            } as const;
          }
        }
      } catch (error) {
        console.warn("SIP API fallback", error);
      }

      return {
        projection: calculateSipProjection(payload),
        source: "client-fallback",
        disclaimer: SEBI_DISCLAIMER,
        upstream: false
      } as const;
    }
  });

  const data = useMemo(() => mutation.data, [mutation.data]);

  return {
    calculate: mutation.mutate,
    calculateAsync: mutation.mutateAsync,
    status: mutation.status,
    error: mutation.error instanceof Error ? mutation.error.message : undefined,
    projection: data?.projection,
    source: data?.source,
    disclaimer: data?.disclaimer ?? SEBI_DISCLAIMER,
    usedServerResult: Boolean(data?.upstream)
  };
}
