import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useHeatmapData, useCategoryRanking, useCategoryStats } from '@/hooks/useHeatmapData';
import {
  getReturnColor,
  getGradientColor,
  getCellStyles,
  formatPercentage,
  getPerformanceLevel
} from '@/lib/heatmap-colors';

const mockFunds = [
  {
    schemeCode: '100001',
    schemeName: 'ELSS Fund 1',
    schemeCategory: 'ELSS',
    expenseRatio: 0.75,
    returns: {
      oneYear: 15.5,
      threeYear: 12.3,
      fiveYear: 11.8
    }
  },
  {
    schemeCode: '100002',
    schemeName: 'ELSS Fund 2',
    schemeCategory: 'ELSS',
    expenseRatio: 0.85,
    returns: {
      oneYear: 14.2,
      threeYear: 11.8,
      fiveYear: 10.5
    }
  },
  {
    schemeCode: '100003',
    schemeName: 'Equity Fund 1',
    schemeCategory: 'Equity',
    expenseRatio: 1.0,
    returns: {
      oneYear: 18.5,
      threeYear: 15.2,
      fiveYear: 14.1
    }
  },
  {
    schemeCode: '100004',
    schemeName: 'Debt Fund 1',
    schemeCategory: 'Debt',
    expenseRatio: 0.5,
    returns: {
      oneYear: 6.8,
      threeYear: 5.9,
      fiveYear: 5.2
    }
  }
];

describe('Heatmap Utilities', () => {
  describe('getReturnColor', () => {
    it('returns red color for negative returns', () => {
      const { color } = getReturnColor(-15);
      expect(color).toBe('#ef4444');
    });

    it('returns light red for small negative returns', () => {
      const { color } = getReturnColor(-5);
      expect(color).toBe('#fca5a5');
    });

    it('returns gray for zero returns', () => {
      const { color } = getReturnColor(0);
      expect(color).toBe('#f3f4f6');
    });

    it('returns light green for small positive returns', () => {
      const { color } = getReturnColor(5);
      expect(color).toBe('#fef3c7');
    });

    it('returns medium green for moderate positive returns', () => {
      const { color } = getReturnColor(15);
      expect(color).toBe('#86efac');
    });

    it('returns dark green for high positive returns', () => {
      const { color } = getReturnColor(25);
      expect(color).toBe('#22c55e');
    });

    it('clamps values outside range', () => {
      const { color } = getReturnColor(50);
      expect(color).toBe('#22c55e'); // Clamped to max range

      const { color: negColor } = getReturnColor(-50);
      expect(negColor).toBe('#ef4444'); // Clamped to min range
    });
  });

  describe('getGradientColor', () => {
    it('returns appropriate color for value in range', () => {
      const color = getGradientColor(50, 0, 100);
      expect(color).toMatch(/rgb\(\d+,\s*\d+,\s*\d+\)/);
    });

    it('returns red for minimum value', () => {
      const color = getGradientColor(0, 0, 100);
      expect(color).toMatch(/rgb\(255,\s*0,\s*0\)/);
    });

    it('returns green for maximum value', () => {
      const color = getGradientColor(100, 0, 100);
      expect(color).toMatch(/rgb\(0,\s*255,\s*0\)/);
    });
  });

  describe('getCellStyles', () => {
    it('returns dark text for positive returns', () => {
      const styles = getCellStyles(15);
      expect(styles.textColor).toBe('#ffffff');
      expect(styles.backgroundColor).toBeTruthy();
    });

    it('returns light text for negative returns', () => {
      const styles = getCellStyles(-15);
      expect(styles.textColor).toBe('#ffffff');
    });

    it('includes border color', () => {
      const styles = getCellStyles(10);
      expect(styles.borderColor).toBe('#e5e7eb');
    });
  });

  describe('formatPercentage', () => {
    it('formats positive numbers with plus sign', () => {
      expect(formatPercentage(15.5)).toBe('+15.50%');
    });

    it('formats negative numbers with minus sign', () => {
      expect(formatPercentage(-5.2)).toBe('-5.20%');
    });

    it('respects decimal places parameter', () => {
      expect(formatPercentage(15.567, 1)).toBe('+15.6%');
      expect(formatPercentage(15.567, 0)).toBe('+16%');
    });

    it('handles NaN values', () => {
      expect(formatPercentage(NaN)).toBe('N/A');
    });

    it('formats zero without sign', () => {
      expect(formatPercentage(0)).toBe('+0.00%');
    });
  });

  describe('getPerformanceLevel', () => {
    it('returns Excellent for high returns', () => {
      expect(getPerformanceLevel(25)).toBe('Excellent');
      expect(getPerformanceLevel(20)).toBe('Excellent');
    });

    it('returns Good for moderate returns', () => {
      expect(getPerformanceLevel(15)).toBe('Good');
      expect(getPerformanceLevel(10)).toBe('Good');
    });

    it('returns Average for small positive returns', () => {
      expect(getPerformanceLevel(5)).toBe('Average');
      expect(getPerformanceLevel(0)).toBe('Average');
    });

    it('returns Poor for small negative returns', () => {
      expect(getPerformanceLevel(-5)).toBe('Poor');
      expect(getPerformanceLevel(-10)).toBe('Poor');
    });

    it('returns Very Poor for large negative returns', () => {
      expect(getPerformanceLevel(-15)).toBe('Very Poor');
      expect(getPerformanceLevel(-25)).toBe('Very Poor');
    });
  });
});

describe('Heatmap Data Hooks', () => {
  describe('useHeatmapData', () => {
    it('aggregates funds by category', () => {
      const { result } = renderHook(() => useHeatmapData(mockFunds));

      expect(result.current).toHaveLength(3);
      const categories = result.current.map((c) => c.category);
      expect(categories).toContain('ELSS');
      expect(categories).toContain('Equity');
      expect(categories).toContain('Debt');
    });

    it('calculates average returns for categories', () => {
      const { result } = renderHook(() => useHeatmapData(mockFunds));

      const elssCategory = result.current.find((c) => c.category === 'ELSS');
      expect(elssCategory).toBeDefined();

      // Average of 15.5 and 14.2
      expect(elssCategory!.returns.oneYear).toBeCloseTo(14.85, 1);
    });

    it('counts funds per category', () => {
      const { result } = renderHook(() => useHeatmapData(mockFunds));

      const elssCategory = result.current.find((c) => c.category === 'ELSS');
      expect(elssCategory!.fundCount).toBe(2);

      const equityCategory = result.current.find((c) => c.category === 'Equity');
      expect(equityCategory!.fundCount).toBe(1);
    });

    it('calculates average expense ratio', () => {
      const { result } = renderHook(() => useHeatmapData(mockFunds));

      const elssCategory = result.current.find((c) => c.category === 'ELSS');
      expect(elssCategory!.avgExpenseRatio).toBeCloseTo(0.8, 1);
    });

    it('handles missing returns gracefully', () => {
      const fundsWithMissing = [
        {
          schemeCode: '100001',
          schemeName: 'Fund 1',
          schemeCategory: 'Equity',
          returns: { oneYear: 15 }
        },
        {
          schemeCode: '100002',
          schemeName: 'Fund 2',
          schemeCategory: 'Equity'
          // Missing returns object
        }
      ];

      const { result } = renderHook(() => useHeatmapData(fundsWithMissing));

      expect(result.current).toHaveLength(1);
      expect(result.current[0].returns.oneYear).toBe(15);
    });

    it('sorts categories alphabetically', () => {
      const { result } = renderHook(() => useHeatmapData(mockFunds));

      const categories = result.current.map((c) => c.category);
      const sorted = [...categories].sort();
      expect(categories).toEqual(sorted);
    });
  });

  describe('useCategoryRanking', () => {
    it('ranks categories by return in descending order', () => {
      const { result: dataResult } = renderHook(() => useHeatmapData(mockFunds));
      const { result: rankResult } = renderHook(() =>
        useCategoryRanking(dataResult.current, 'oneYear')
      );

      expect(rankResult.current[0].rank).toBe(1);
      expect(rankResult.current[0].category).toBe('Equity');

      expect(rankResult.current[rankResult.current.length - 1].rank).toBe(
        rankResult.current.length
      );
      expect(rankResult.current[rankResult.current.length - 1].category).toBe('Debt');
    });

    it('updates ranking when period changes', () => {
      const { result: dataResult } = renderHook(() => useHeatmapData(mockFunds));

      const { result: oneYearResult } = renderHook(() =>
        useCategoryRanking(dataResult.current, 'oneYear')
      );
      const { result: threeYearResult } = renderHook(() =>
        useCategoryRanking(dataResult.current, 'threeYear')
      );

      expect(oneYearResult.current[0].category).toBe('Equity');
      expect(threeYearResult.current[0].category).toBe('Equity');
    });
  });

  describe('useCategoryStats', () => {
    it('calculates best and worst categories', () => {
      const { result: dataResult } = renderHook(() => useHeatmapData(mockFunds));
      const { result } = renderHook(() => useCategoryStats(dataResult.current));

      expect(result.current.bestCategory?.category).toBe('Equity');
      expect(result.current.worstCategory?.category).toBe('Debt');
    });

    it('calculates average category returns', () => {
      const { result: dataResult } = renderHook(() => useHeatmapData(mockFunds));
      const { result } = renderHook(() => useCategoryStats(dataResult.current));

      // Average of all categories' 1-year returns
      const expectedAvg =
        (14.85 + 18.5 + 6.8) / 3; // (ELSS + Equity + Debt) / 3
      expect(result.current.avgCategoryReturn.oneYear).toBeCloseTo(expectedAvg, 0);
    });

    it('counts total funds', () => {
      const { result: dataResult } = renderHook(() => useHeatmapData(mockFunds));
      const { result } = renderHook(() => useCategoryStats(dataResult.current));

      expect(result.current.totalFunds).toBe(4);
    });

    it('handles empty data', () => {
      const { result } = renderHook(() => useCategoryStats([]));

      expect(result.current.bestCategory).toBeNull();
      expect(result.current.worstCategory).toBeNull();
      expect(result.current.totalFunds).toBe(0);
    });
  });
});
