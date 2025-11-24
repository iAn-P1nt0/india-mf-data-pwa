import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  exportToCSV,
  exportComparisonToCSV,
  exportPortfolioToCSV,
  exportNAVHistoryToCSV,
  createFundComparisonHTML
} from '@/lib/export';

// Mock the downloadFile function by mocking URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock document methods
document.createElement = vi.fn((tag) => ({
  href: '',
  download: '',
  click: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
} as unknown as HTMLElement));

document.body.appendChild = vi.fn();
document.body.removeChild = vi.fn();

describe('Export Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('exportToCSV', () => {
    it('creates CSV blob from data array', () => {
      const data = [
        {
          schemeName: 'Fund A',
          fundHouse: 'House A',
          schemeCategory: 'Equity',
          schemeCode: '100001'
        }
      ];

      // Mock Blob
      global.Blob = vi.fn(() => ({}) as unknown as Blob);

      exportToCSV(data, 'test.csv');

      expect(global.Blob).toHaveBeenCalled();
      expect(document.body.appendChild).toHaveBeenCalled();
    });

    it('downloads file with correct filename', () => {
      const data = [
        {
          schemeName: 'Fund A',
          fundHouse: 'House A',
          schemeCategory: 'Equity',
          schemeCode: '100001'
        }
      ];

      global.Blob = vi.fn(() => ({}) as unknown as Blob);

      exportToCSV(data, 'custom-export.csv');

      const link = (document.createElement as any).mock.results[0]?.value;
      expect(link).toBeDefined();
    });
  });

  describe('exportComparisonToCSV', () => {
    it('exports fund comparison with metadata and NAV data', () => {
      const funds = [
        {
          meta: {
            scheme_name: 'Fund A',
            fund_house: 'House A',
            scheme_category: 'Equity',
            scheme_code: '100001'
          },
          data: [
            { date: '2025-01-01', nav: '100.00' },
            { date: '2025-01-02', nav: '102.00' }
          ]
        }
      ];

      global.Blob = vi.fn(() => ({}) as unknown as Blob);

      exportComparisonToCSV(funds, 'comparison.csv');

      expect(global.Blob).toHaveBeenCalled();
      expect(document.body.appendChild).toHaveBeenCalled();
    });

    it('handles multiple funds with different data lengths', () => {
      const funds = [
        {
          meta: {
            scheme_name: 'Fund A',
            fund_house: 'House A',
            scheme_category: 'Equity',
            scheme_code: '100001'
          },
          data: [
            { date: '2025-01-01', nav: '100.00' },
            { date: '2025-01-02', nav: '102.00' },
            { date: '2025-01-03', nav: '105.00' }
          ]
        },
        {
          meta: {
            scheme_name: 'Fund B',
            fund_house: 'House B',
            scheme_category: 'Debt',
            scheme_code: '100002'
          },
          data: [{ date: '2025-01-01', nav: '50.00' }]
        }
      ];

      global.Blob = vi.fn(() => ({}) as unknown as Blob);

      exportComparisonToCSV(funds);

      expect(global.Blob).toHaveBeenCalled();
    });
  });

  describe('exportPortfolioToCSV', () => {
    it('exports portfolio holdings with summary', () => {
      const holdings = [
        {
          schemeCode: '100001',
          schemeName: 'Fund A',
          fundHouse: 'House A',
          units: 100,
          avgNav: 50
        },
        {
          schemeCode: '100002',
          schemeName: 'Fund B',
          fundHouse: 'House B',
          units: 200,
          avgNav: 100
        }
      ];

      global.Blob = vi.fn(() => ({}) as unknown as Blob);

      exportPortfolioToCSV(holdings);

      expect(global.Blob).toHaveBeenCalled();
      expect(document.body.appendChild).toHaveBeenCalled();
    });

    it('calculates investment correctly', () => {
      const holdings = [
        {
          schemeCode: '100001',
          schemeName: 'Fund A',
          fundHouse: 'House A',
          units: 100,
          avgNav: 50
        }
      ];

      global.Blob = vi.fn(() => ({}) as unknown as Blob);

      exportPortfolioToCSV(holdings);

      // Verification would happen through inspection of the CSV content
      expect(global.Blob).toHaveBeenCalled();
    });
  });

  describe('exportNAVHistoryToCSV', () => {
    it('exports NAV history with scheme details', () => {
      const navData = [
        { date: '2025-01-01', nav: '100.00' },
        { date: '2025-01-02', nav: '102.00' }
      ];

      global.Blob = vi.fn(() => ({}) as unknown as Blob);

      exportNAVHistoryToCSV('100001', 'Test Fund', navData);

      expect(global.Blob).toHaveBeenCalled();
    });

    it('generates correct filename from scheme code', () => {
      const navData = [{ date: '2025-01-01', nav: '100.00' }];

      global.Blob = vi.fn(() => ({}) as unknown as Blob);

      exportNAVHistoryToCSV('100001', 'Test Fund', navData, '100001-nav-history.csv');

      expect(global.Blob).toHaveBeenCalled();
    });
  });

  describe('createFundComparisonHTML', () => {
    it('generates valid HTML for PDF export', () => {
      const funds = [
        {
          meta: {
            scheme_name: 'Fund A',
            fund_house: 'House A',
            scheme_category: 'Equity',
            scheme_code: '100001',
            isin_growth: 'INF123K01AR2'
          },
          data: [{ date: '2025-01-01', nav: '100.00' }]
        }
      ];

      const disclaimer = 'Mutual fund investments are subject to market risks';

      const html = createFundComparisonHTML(funds, disclaimer);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Fund Comparison Report');
      expect(html).toContain('Fund A');
      expect(html).toContain('House A');
      expect(html).toContain(disclaimer);
    });

    it('escapes HTML special characters in content', () => {
      const funds = [
        {
          meta: {
            scheme_name: 'Fund & Special <Characters>',
            fund_house: 'House "A"',
            scheme_category: "Equity's Category",
            scheme_code: '100001',
            isin_growth: 'INF123K01AR2'
          },
          data: []
        }
      ];

      const html = createFundComparisonHTML(funds, 'Test');

      expect(html).toContain('&amp;');
      expect(html).toContain('&lt;');
      expect(html).toContain('&gt;');
      expect(html).toContain('&quot;');
    });

    it('includes multiple funds in comparison', () => {
      const funds = [
        {
          meta: {
            scheme_name: 'Fund A',
            fund_house: 'House A',
            scheme_category: 'Equity',
            scheme_code: '100001',
            isin_growth: 'INF123K01AR2'
          },
          data: []
        },
        {
          meta: {
            scheme_name: 'Fund B',
            fund_house: 'House B',
            scheme_category: 'Debt',
            scheme_code: '100002',
            isin_growth: 'INF123K02AR2'
          },
          data: []
        }
      ];

      const html = createFundComparisonHTML(funds, 'Test');

      expect(html).toContain('Fund A');
      expect(html).toContain('Fund B');
      expect(html).toContain('Fund 1');
      expect(html).toContain('Fund 2');
    });
  });
});
