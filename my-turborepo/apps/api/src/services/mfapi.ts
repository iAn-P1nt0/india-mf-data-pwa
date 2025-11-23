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

interface FundResponse {
  meta: FundMeta;
  data: NavPoint[];
  status: string;
}

interface FundMeta {
  fund_house: string;
  scheme_type: string;
  scheme_category: string;
  scheme_code: string;
  scheme_name: string;
}

interface NavPoint {
  date: string;
  nav: string;
}

export async function fetchFundDetails(schemeCode: string): Promise<FundResponse> {
  return fetchWithTimeout<FundResponse>(`${env.MFAPI_BASE_URL}/${schemeCode}`);
}

export async function fetchHistoricalNav(
  schemeCode: string,
  startDate?: string,
  endDate?: string
): Promise<FundResponse> {
  const params = new URLSearchParams();
  if (startDate) params.append('start', startDate);
  if (endDate) params.append('end', endDate);
  const url = params.size ? `${env.MFAPI_BASE_URL}/${schemeCode}?${params.toString()}` : `${env.MFAPI_BASE_URL}/${schemeCode}`;
  const response = await fetchWithTimeout<FundResponse>(url);

  if (!startDate && !endDate) {
    return response;
  }

  const startBoundary = toIsoDate(startDate);
  const endBoundary = toIsoDate(endDate);

  if (!startBoundary && !endBoundary) {
    return response;
  }

  const filteredData = response.data.filter((point) => {
    const pointDate = parseMfapiDate(point.date);
    if (!pointDate) return true;
    if (startBoundary && pointDate < startBoundary) return false;
    if (endBoundary && pointDate > endBoundary) return false;
    return true;
  });

  return {
    ...response,
    data: filteredData
  };
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

function toIsoDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function parseMfapiDate(value: string): Date | undefined {
  const [day, month, year] = value.split('-').map((token) => Number.parseInt(token, 10));
  if (!day || !month || !year) {
    return undefined;
  }
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}
