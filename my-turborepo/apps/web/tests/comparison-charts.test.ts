import { describe, it, expect } from 'vitest';
import {
  normalizeNAVData,
  calculatePercentageChange,
  mergeNAVHistories,
  createChartDataset,
  getDefaultColor,
  calculatePerformanceStats,
  formatChartValue,
  formatChartDate,
  compareFunds,
  filterByDateRange,
  getDateRangePreset,
  FundChartData,
  NAVData
} from '@/lib/chart-data';
import { subMonths } from 'date-fns';

// Mock fund data
const mockNAVHistory: NAVData[] = [
  { date: '2024-01-01', nav: 100 },
  { date: '2024-01-02', nav: 102 },
  { date: '2024-01-03', nav: 105 },
  { date: '2024-01-04', nav: 103 },
  { date: '2024-01-05', nav: 108 }
];

const mockFunds: FundChartData[] = [
  {
    schemeCode: '100001',
    schemeName: 'Fund A',
    navHistory: mockNAVHistory,
    color: '#3b82f6'
  },
  {
    schemeCode: '100002',
    schemeName: 'Fund B',
    navHistory: [
      { date: '2024-01-01', nav: 50 },
      { date: '2024-01-02', nav: 51 },
      { date: '2024-01-03', nav: 52.5 },
      { date: '2024-01-04', nav: 51.5 },
      { date: '2024-01-05', nav: 54 }
    ],
    color: '#ef4444'
  }
];

describe('Chart Data Utilities', () => {
  describe('normalizeNAVData', () => {
    it('normalizes NAV data to start at 100', () => {
      const normalized = normalizeNAVData(mockNAVHistory);

      expect(normalized[0].nav).toBe(100);
      expect(normalized[1].nav).toBeCloseTo(102, 1);
      expect(normalized[4].nav).toBeCloseTo(108, 1);
    });

    it('handles empty data', () => {
      const result = normalizeNAVData([]);
      expect(result).toEqual([]);
    });

    it('handles zero starting NAV', () => {
      const data: NAVData[] = [{ date: '2024-01-01', nav: 0 }];
      const result = normalizeNAVData(data);
      expect(result[0].nav).toBe(0);
    });

    it('preserves dates', () => {
      const normalized = normalizeNAVData(mockNAVHistory);

      expect(normalized[0].date).toBe('2024-01-01');
      expect(normalized[4].date).toBe('2024-01-05');
    });
  });

  describe('calculatePercentageChange', () => {
    it('calculates percentage change from starting NAV', () => {
      const changes = calculatePercentageChange(mockNAVHistory);

      expect(changes[0].nav).toBe(0);
      expect(changes[1].nav).toBeCloseTo(2, 1);
      expect(changes[4].nav).toBeCloseTo(8, 1);
    });

    it('handles negative changes', () => {
      const data: NAVData[] = [
        { date: '2024-01-01', nav: 100 },
        { date: '2024-01-02', nav: 90 },
        { date: '2024-01-03', nav: 95 }
      ];
      const changes = calculatePercentageChange(data);

      expect(changes[0].nav).toBe(0);
      expect(changes[1].nav).toBe(-10);
      expect(changes[2].nav).toBe(-5);
    });

    it('handles empty data', () => {
      const result = calculatePercentageChange([]);
      expect(result).toEqual([]);
    });
  });

  describe('getDefaultColor', () => {
    it('returns a color for valid index', () => {
      const color = getDefaultColor(0);
      expect(color).toBe('#3b82f6');

      const color2 = getDefaultColor(1);
      expect(color2).toBe('#ef4444');
    });

    it('cycles through colors for large indices', () => {
      const color1 = getDefaultColor(0);
      const color9 = getDefaultColor(8);

      expect(color1).toBe(color9);
    });

    it('has at least 8 colors', () => {
      const colors = new Set();
      for (let i = 0; i < 8; i++) {
        colors.add(getDefaultColor(i));
      }
      expect(colors.size).toBe(8);
    });
  });

  describe('calculatePerformanceStats', () => {
    it('calculates statistics correctly', () => {
      const stats = calculatePerformanceStats(mockNAVHistory);

      expect(stats.startingNAV).toBe(100);
      expect(stats.endingNAV).toBe(108);
      expect(stats.totalReturn).toBe(8);
      expect(stats.returnPercentage).toBe(8);
      expect(stats.daysInPeriod).toBe(4);
    });

    it('calculates average NAV', () => {
      const stats = calculatePerformanceStats(mockNAVHistory);
      const expectedAvg = (100 + 102 + 105 + 103 + 108) / 5;

      expect(stats.avgNAV).toBeCloseTo(expectedAvg, 1);
    });

    it('finds min and max NAV', () => {
      const stats = calculatePerformanceStats(mockNAVHistory);

      expect(stats.minNAV).toBe(100);
      expect(stats.maxNAV).toBe(108);
    });

    it('calculates volatility', () => {
      const stats = calculatePerformanceStats(mockNAVHistory);

      expect(stats.volatility).toBeGreaterThan(0);
      expect(stats.volatility).toBeLessThan(10);
    });

    it('handles empty data', () => {
      const stats = calculatePerformanceStats([]);

      expect(stats.startingNAV).toBe(0);
      expect(stats.endingNAV).toBe(0);
      expect(stats.totalReturn).toBe(0);
    });

    it('handles single data point', () => {
      const data: NAVData[] = [{ date: '2024-01-01', nav: 100 }];
      const stats = calculatePerformanceStats(data);

      expect(stats.startingNAV).toBe(100);
      expect(stats.endingNAV).toBe(100);
      expect(stats.totalReturn).toBe(0);
      expect(stats.daysInPeriod).toBe(0);
    });
  });

  describe('formatChartValue', () => {
    it('formats absolute values with rupee sign', () => {
      const formatted = formatChartValue(150.5, 'absolute');
      expect(formatted).toBe('₹150.50');
    });

    it('formats normalized values as percentage', () => {
      const formatted = formatChartValue(125, 'normalized');
      expect(formatted).toBe('+125.00%');
    });

    it('formats percentage change with sign', () => {
      const formatted = formatChartValue(15.5, 'percentage');
      expect(formatted).toBe('+15.50%');

      const negativeFormatted = formatChartValue(-8.3, 'percentage');
      expect(negativeFormatted).toBe('-8.30%');
    });

    it('handles null values', () => {
      const formatted = formatChartValue(null, 'absolute');
      expect(formatted).toBe('N/A');
    });

    it('handles NaN values', () => {
      const formatted = formatChartValue(NaN, 'absolute');
      expect(formatted).toBe('N/A');
    });
  });

  describe('formatChartDate', () => {
    it('formats valid date strings', () => {
      const formatted = formatChartDate('2024-01-15');
      expect(formatted).toContain('Jan');
      expect(formatted).toContain('2024');
    });

    it('handles invalid dates gracefully', () => {
      const formatted = formatChartDate('invalid');
      expect(formatted).toBe('invalid');
    });
  });

  describe('compareFunds', () => {
    it('ranks funds by return percentage', () => {
      const comparisons = compareFunds(mockFunds);

      expect(comparisons).toHaveLength(2);
      expect(comparisons[0].rank).toBe(1);
      expect(comparisons[1].rank).toBe(2);
    });

    it('calculates stats for each fund', () => {
      const comparisons = compareFunds(mockFunds);

      expect(comparisons[0].stats).toBeDefined();
      expect(comparisons[0].stats.returnPercentage).toBeGreaterThan(0);
    });

    it('handles empty fund list', () => {
      const comparisons = compareFunds([]);
      expect(comparisons).toEqual([]);
    });
  });

  describe('filterByDateRange', () => {
    it('filters NAV data by date range', () => {
      const startDate = new Date('2024-01-02');
      const endDate = new Date('2024-01-04');

      const filtered = filterByDateRange(mockNAVHistory, startDate, endDate);

      expect(filtered).toHaveLength(3);
      expect(filtered[0].date).toBe('2024-01-02');
      expect(filtered[2].date).toBe('2024-01-04');
    });

    it('handles date range outside of data', () => {
      const startDate = new Date('2024-02-01');
      const endDate = new Date('2024-02-28');

      const filtered = filterByDateRange(mockNAVHistory, startDate, endDate);

      expect(filtered).toHaveLength(0);
    });

    it('handles inclusive boundaries', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-05');

      const filtered = filterByDateRange(mockNAVHistory, startDate, endDate);

      expect(filtered).toHaveLength(5);
    });
  });

  describe('getDateRangePreset', () => {
    it('returns correct presets', () => {
      const oneMonth = getDateRangePreset('oneMonth');
      expect(oneMonth.label).toBe('1 Month');
      expect(oneMonth.startDate.getTime()).toBeLessThan(oneMonth.endDate.getTime());

      const oneYear = getDateRangePreset('oneYear');
      expect(oneYear.label).toBe('1 Year');

      const fiveYears = getDateRangePreset('fiveYears');
      expect(fiveYears.label).toBe('5 Years');
    });

    it('calculates correct date differences', () => {
      const oneMonth = getDateRangePreset('oneMonth');
      const months =
        (oneMonth.endDate.getTime() - oneMonth.startDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
      expect(months).toBeCloseTo(1, 0);

      const oneYear = getDateRangePreset('oneYear');
      const years =
        (oneYear.endDate.getTime() - oneYear.startDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
      expect(years).toBeCloseTo(1, 0);
    });
  });

  describe('mergeNAVHistories', () => {
    it('merges multiple fund histories', () => {
      const merged = mergeNAVHistories(mockFunds, 'absolute');

      expect(merged.length).toBeGreaterThan(0);
      expect(merged[0]).toHaveProperty('date');
      expect(merged[0]).toHaveProperty('timestamp');
    });

    it('handles normalized view mode', () => {
      const merged = mergeNAVHistories(mockFunds, 'normalized');

      expect(merged[0]).toHaveProperty('nav_100001');
      expect(merged[0]).toHaveProperty('nav_100002');
    });

    it('handles empty fund list', () => {
      const merged = mergeNAVHistories([], 'absolute');
      expect(merged).toEqual([]);
    });
  });

  describe('createChartDataset', () => {
    it('creates chart dataset with fund keys', () => {
      const dataset = createChartDataset(mockFunds, 'absolute');

      expect(dataset.data).toBeDefined();
      expect(dataset.fundKeys).toHaveLength(2);
      expect(dataset.fundKeys[0].code).toBe('100001');
      expect(dataset.fundKeys[0].name).toBe('Fund A');
    });

    it('assigns colors to funds', () => {
      const dataset = createChartDataset(mockFunds, 'absolute');

      expect(dataset.fundKeys[0].color).toBe('#3b82f6');
      expect(dataset.fundKeys[1].color).toBe('#ef4444');
    });

    it('uses default colors if not provided', () => {
      const fundsWithoutColors: FundChartData[] = mockFunds.map((f) => ({
        ...f,
        color: undefined
      }));

      const dataset = createChartDataset(fundsWithoutColors, 'absolute');

      expect(dataset.fundKeys[0].color).toBeDefined();
      expect(dataset.fundKeys[1].color).toBeDefined();
    });
  });
});
