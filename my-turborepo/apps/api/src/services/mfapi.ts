import { env } from '../config/env';

interface RawFundListItem {
  schemeCode: string;
  schemeName: string;
  fund_house?: string;
  schemeType?: string;
  schemeCategory?: string;
}

export type FundListItem = {
  schemeCode: string;
  schemeName: string;
  fundHouse?: string | null;
  schemeType?: string | null;
  schemeCategory?: string | null;
};

const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_LIMIT = 100;

async function fetchWithTimeout<T>(url: string, signal?: AbortSignal): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'india-mf-data-pwa/1.0 (+github.com/iAn-P1nt0/mf-data-pwa)'
      },
      signal: signal ?? controller.signal
    });

    if (!response.ok) {
      throw new Error(`MFapi request failed with status ${response.status}`);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchFunds(limit = 10): Promise<FundListItem[]> {
  const cappedLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);
  const data = await fetchWithTimeout<RawFundListItem[]>(env.MFAPI_BASE_URL);
  return data.slice(0, cappedLimit).map(normalizeFund);
}

export async function fetchFundsFiltered(query: string, limit = 20): Promise<FundListItem[]> {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return fetchFunds(limit);
  }

  const raw = await fetchWithTimeout<RawFundListItem[]>(env.MFAPI_BASE_URL);
  const filtered = raw.filter((fund) => {
    const haystack = `${fund.schemeName} ${fund.schemeCode} ${fund.fund_house ?? ''}`.toLowerCase();
    return haystack.includes(normalized);
  });

  return filtered.slice(0, Math.min(Math.max(limit, 1), MAX_LIMIT)).map(normalizeFund);
}

function normalizeFund(item: RawFundListItem): FundListItem {
  return {
    schemeCode: item.schemeCode,
    schemeName: item.schemeName,
    fundHouse: item.fund_house ?? null,
    schemeType: item.schemeType ?? null,
    schemeCategory: item.schemeCategory ?? null
  };
}

export const sebiDisclaimer =
  'Mutual fund investments are subject to market risks. Read all scheme related documents carefully. Historical returns do not guarantee future performance.';
