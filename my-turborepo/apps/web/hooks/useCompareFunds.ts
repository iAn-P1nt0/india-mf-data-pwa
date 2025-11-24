import { useMutation, useQuery } from '@tanstack/react-query';

interface FundMeta {
  fund_house: string;
  scheme_type: string;
  scheme_category: string;
  scheme_code: string;
  scheme_name: string;
  isin_growth: string;
  isin_div_reinvestment: string;
}

interface NAVPoint {
  date: string;
  nav: string;
}

interface Fund {
  meta: FundMeta;
  data: NAVPoint[];
  status: string;
}

interface CompareResponse {
  success: boolean;
  funds: Fund[];
  count: number;
  disclaimer: string;
  source: string;
  fetchedAt: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api';

export function useCompareFunds(schemeCodes: string[]) {
  return useQuery({
    queryKey: ['compareFunds', schemeCodes],
    queryFn: async () => {
      if (schemeCodes.length === 0) {
        return null;
      }

      const response = await fetch(`${API_BASE}/funds/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schemeCodes })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch fund comparison');
      }

      return (await response.json()) as CompareResponse;
    },
    enabled: schemeCodes.length > 0
  });
}

export function useAddFundToComparison() {
  return useMutation({
    mutationFn: async (schemeCodes: string[]) => {
      if (schemeCodes.length === 0 || schemeCodes.length > 3) {
        throw new Error('Please select 1-3 funds to compare');
      }

      const response = await fetch(`${API_BASE}/funds/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schemeCodes })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to compare funds');
      }

      return (await response.json()) as CompareResponse;
    }
  });
}

export type { Fund, FundMeta, NAVPoint, CompareResponse };
