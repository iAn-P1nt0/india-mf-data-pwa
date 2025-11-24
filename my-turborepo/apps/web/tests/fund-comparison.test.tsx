import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCompareFunds, useAddFundToComparison } from '@/hooks/useCompareFunds';
import React from 'react';

const mockFundsResponse = {
  success: true,
  funds: [
    {
      meta: {
        fund_house: 'HDFC AMC',
        scheme_type: 'Equity',
        scheme_category: 'ELSS',
        scheme_code: '119551',
        scheme_name: 'HDFC Tax Saver Fund',
        isin_growth: 'INF209K01AR2',
        isin_div_reinvestment: 'INF209K01AS0'
      },
      data: [
        { date: '2025-01-15', nav: '150.50' },
        { date: '2025-01-16', nav: '152.30' }
      ],
      status: 'SUCCESS'
    }
  ],
  count: 1,
  disclaimer: 'Mutual fund investments are subject to market risks',
  source: 'MFapi.in',
  fetchedAt: '2025-01-16T10:00:00Z'
};

describe('Fund Comparison Hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false }
      }
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    )
  );

  describe('useCompareFunds', () => {
    it('returns null when no schemeCodes provided', () => {
      const { result } = renderHook(() => useCompareFunds([]), { wrapper });

      expect(result.current.data).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
    });

    it('fetches funds for provided schemeCodes', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockFundsResponse)
        } as Response)
      );

      const { result } = renderHook(
        () => useCompareFunds(['119551']),
        { wrapper }
      );

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockFundsResponse);
      expect(result.current.data?.funds).toHaveLength(1);
      expect(result.current.data?.funds[0].meta.scheme_code).toBe('119551');
    });

    it('handles API errors gracefully', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 400,
          json: () => Promise.resolve({ error: 'Invalid scheme codes' })
        } as Response)
      );

      const { result } = renderHook(
        () => useCompareFunds(['invalid']),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
    });

    it('sends correct payload format', async () => {
      const fetchSpy = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockFundsResponse)
        } as Response)
      );

      global.fetch = fetchSpy;

      renderHook(() => useCompareFunds(['119551', '119552']), { wrapper });

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/funds/compare'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ schemeCodes: ['119551', '119552'] })
        });
      });
    });
  });

  describe('useAddFundToComparison', () => {
    it('validates scheme codes count', async () => {
      const { result } = renderHook(() => useAddFundToComparison(), { wrapper });

      result.current.mutate([]);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(result.current.error?.message).toMatch(/1-3 funds/);
      });
    });

    it('successfully adds funds to comparison', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockFundsResponse)
        } as Response)
      );

      const { result } = renderHook(() => useAddFundToComparison(), { wrapper });

      result.current.mutate(['119551']);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
        expect(result.current.data).toEqual(mockFundsResponse);
      });
    });

    it('rejects more than 3 funds', async () => {
      const { result } = renderHook(() => useAddFundToComparison(), { wrapper });

      result.current.mutate(['119551', '119552', '119553', '119554']);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(result.current.error?.message).toMatch(/1-3 funds/);
      });
    });

    it('handles API errors', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 400,
          json: () => Promise.resolve({ error: 'Failed to compare funds' })
        } as Response)
      );

      const { result } = renderHook(() => useAddFundToComparison(), { wrapper });

      result.current.mutate(['119551']);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });
});
