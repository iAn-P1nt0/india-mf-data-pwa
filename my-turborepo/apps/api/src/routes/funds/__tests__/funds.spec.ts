import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { createApp } from '../../../app';
import { env } from '../../../config/env';

const FUNDS_FIXTURE = [
  {
    schemeCode: '100027',
    schemeName: 'Grindlays Super Saver Income Fund-GSSIF-Half Yearly Dividend',
    fund_house: 'Grindlays AMC',
    schemeType: 'Debt',
    schemeCategory: 'Income'
  },
  {
    schemeCode: '100028',
    schemeName: 'Grindlays Super Saver Income Fund-GSSIF-Quaterly Dividend',
    fund_house: 'Grindlays AMC',
    schemeType: 'Debt',
    schemeCategory: 'Income'
  },
  {
    schemeCode: '100029',
    schemeName: 'Super Balanced Advantage Fund-Growth',
    fund_house: 'Balanced AMC',
    schemeType: 'Hybrid',
    schemeCategory: 'Balanced'
  }
];

const FUND_DETAIL_FIXTURE = {
  meta: {
    fund_house: 'Aditya Birla Sun Life Mutual Fund',
    scheme_type: 'Open Ended Schemes',
    scheme_category: 'Debt Scheme - Banking and PSU Fund',
    scheme_code: '119551',
    scheme_name: 'Aditya Birla Sun Life Banking & PSU Debt Fund  - DIRECT - IDCW',
    isin_growth: 'INF209KA12Z1',
    isin_div_reinvestment: 'INF209KA13Z9'
  },
  data: [
    { date: '21-11-2025', nav: '110.07080' },
    { date: '20-11-2025', nav: '109.99830' }
  ],
  status: 'SUCCESS'
};

const NAV_HISTORY_FIXTURE = {
  ...FUND_DETAIL_FIXTURE,
  data: [
    { date: '31-12-2023', nav: '109.07080' },
    { date: '15-01-2024', nav: '109.99830' },
    { date: '01-02-2024', nav: '110.07080' }
  ]
};

const fetchMock = vi.fn();

const MFAPI_BASE_URL = env.MFAPI_BASE_URL;

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return body;
    }
  } as Response;
}

function resolvePayload(url: string) {
  if (url === MFAPI_BASE_URL) {
    return FUNDS_FIXTURE;
  }

  if (url.startsWith(`${MFAPI_BASE_URL}/119551`)) {
    if (url.includes('?')) {
      return NAV_HISTORY_FIXTURE;
    }
    return FUND_DETAIL_FIXTURE;
  }

  throw new Error(`Unhandled fetch in test for URL: ${url}`);
}

beforeAll(() => {
  vi.stubGlobal('fetch', fetchMock);
});

afterAll(() => {
  vi.unstubAllGlobals();
});

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockImplementation(async (input) => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    const payload = resolvePayload(url);
    return jsonResponse(payload);
  });
});

describe('Funds routes', () => {
  const buildApp = () => createApp();

  it('returns capped fund list with disclaimer', async () => {
    const response = await request(buildApp()).get('/api/funds?limit=2');

    expect(response.status).toBe(200);
    expect(response.body.count).toBe(2);
    expect(response.body.funds).toHaveLength(2);
    expect(response.body.funds[0].schemeCode).toBe('100027');
    expect(response.body.disclaimer).toContain('Mutual fund investments are subject to market risks');
  });

  it('filters fund list when query parameter is provided', async () => {
    const response = await request(buildApp()).get('/api/funds?q=quaterly');

    expect(response.status).toBe(200);
    expect(response.body.count).toBe(1);
    expect(response.body.funds[0].schemeCode).toBe('100028');
  });

  it('returns fund details for a valid scheme code', async () => {
    const response = await request(buildApp()).get('/api/funds/119551');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.fund.meta.scheme_code).toBe('119551');
  });

  it('rejects invalid date formats', async () => {
    const response = await request(buildApp()).get('/api/funds/119551/nav?start=2024/01/01');

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/Invalid start date/);
  });

  it('rejects inverted date ranges', async () => {
    const response = await request(buildApp()).get('/api/funds/119551/nav?start=2024-02-10&end=2024-02-01');

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/start must be before or equal to end/);
  });

  it('filters NAV history using start/end dates when valid inputs are provided', async () => {
    const response = await request(buildApp()).get('/api/funds/119551/nav?start=2024-01-01&end=2024-01-31');

    expect(response.status).toBe(200);
    expect(response.body.navHistory.data).toHaveLength(1);
    expect(response.body.navHistory.data[0].date).toBe('15-01-2024');
  });
});
