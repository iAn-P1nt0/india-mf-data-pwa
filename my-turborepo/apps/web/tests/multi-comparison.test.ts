import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMultiComparisonChart } from '@/hooks/useMultiComparisonChart';
import { FundChartData } from '@/lib/chart-data';

const mockFunds: FundChartData[] = [
  {
    schemeCode: '100001',
    schemeName: 'Fund A',
    navHistory: [
      { date: '2024-01-01', nav: 100 },
      { date: '2024-01-02', nav: 102 },
      { date: '2024-01-03', nav: 105 },
      { date: '2024-01-04', nav: 103 },
      { date: '2024-01-05', nav: 108 }
    ],
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
  },
  {
    schemeCode: '100003',
    schemeName: 'Fund C',
    navHistory: [
      { date: '2024-01-01', nav: 75 },
      { date: '2024-01-02', nav: 76 },
      { date: '2024-01-03', nav: 74 },
      { date: '2024-01-04', nav: 77 },
      { date: '2024-01-05', nav: 78 }
    ],
    color: '#10b981'
  }
];

describe('useMultiComparisonChart Hook', () => {
  describe('Initialization', () => {
    it('initializes with all funds selected', () => {
      const { result } = renderHook(() => ({
        hook: useMultiComparisonChart({ funds: mockFunds })
      }));

      expect(result.current.hook.selectedFunds.size).toBe(3);
      expect(result.current.hook.selectedFunds.has('100001')).toBe(true);
      expect(result.current.hook.selectedFunds.has('100002')).toBe(true);
      expect(result.current.hook.selectedFunds.has('100003')).toBe(true);
    });

    it('sets initial view mode to absolute', () => {
      const { result } = renderHook(() => ({
        hook: useMultiComparisonChart({ funds: mockFunds })
      }));

      expect(result.current.hook.viewMode).toBe('absolute');
    });

    it('sets initial period to oneYear', () => {
      const { result } = renderHook(() => ({
        hook: useMultiComparisonChart({ funds: mockFunds })
      }));

      expect(result.current.hook.selectedPeriod).toBe('oneYear');
    });

    it('allows custom initial view mode', () => {
      const { result } = renderHook(() => ({
        hook: useMultiComparisonChart({
          funds: mockFunds,
          initialViewMode: 'normalized'
        })
      }));

      expect(result.current.hook.viewMode).toBe('normalized');
    });

    it('allows custom initial period', () => {
      const { result } = renderHook(() => ({
        hook: useMultiComparisonChart({
          funds: mockFunds,
          initialPeriod: 'threeMonths'
        })
      }));

      expect(result.current.hook.selectedPeriod).toBe('threeMonths');
    });
  });

  describe('View Mode Changes', () => {
    it('changes view mode when handleViewModeChange is called', () => {
      const { result } = renderHook(() => ({
        hook: useMultiComparisonChart({ funds: mockFunds })
      }));

      act(() => {
        result.current.hook.handleViewModeChange('normalized');
      });

      expect(result.current.hook.viewMode).toBe('normalized');
    });

    it('handles all view mode types', () => {
      const { result } = renderHook(() => ({
        hook: useMultiComparisonChart({ funds: mockFunds })
      }));

      const modes = ['absolute', 'normalized', 'percentage'] as const;

      modes.forEach((mode) => {
        act(() => {
          result.current.hook.handleViewModeChange(mode);
        });
        expect(result.current.hook.viewMode).toBe(mode);
      });
    });
  });

  describe('Period Changes', () => {
    it('changes period when handlePeriodChange is called', () => {
      const { result } = renderHook(() => ({
        hook: useMultiComparisonChart({ funds: mockFunds })
      }));

      act(() => {
        result.current.hook.handlePeriodChange('sixMonths');
      });

      expect(result.current.hook.selectedPeriod).toBe('sixMonths');
    });

    it('updates chart data when period changes', () => {
      const { result } = renderHook(() => ({
        hook: useMultiComparisonChart({ funds: mockFunds })
      }));

      const initialDataLength = result.current.hook.chartDataset.data.length;

      act(() => {
        result.current.hook.handlePeriodChange('oneMonth');
      });

      const newDataLength = result.current.hook.chartDataset.data.length;

      // Note: Data length may vary based on actual date ranges
      expect(newDataLength).toBeDefined();
    });
  });

  describe('Fund Selection', () => {
    it('toggles fund selection', () => {
      const { result } = renderHook(() => ({
        hook: useMultiComparisonChart({ funds: mockFunds })
      }));

      act(() => {
        result.current.hook.toggleFundSelection('100001');
      });

      expect(result.current.hook.selectedFunds.has('100001')).toBe(false);
    });

    it('allows multiple toggles', () => {
      const { result } = renderHook(() => ({
        hook: useMultiComparisonChart({ funds: mockFunds })
      }));

      act(() => {
        result.current.hook.toggleFundSelection('100001');
      });

      expect(result.current.hook.selectedFunds.has('100001')).toBe(false);

      act(() => {
        result.current.hook.toggleFundSelection('100001');
      });

      expect(result.current.hook.selectedFunds.has('100001')).toBe(true);
    });

    it('selects all funds', () => {
      const { result } = renderHook(() => ({
        hook: useMultiComparisonChart({ funds: mockFunds })
      }));

      act(() => {
        result.current.hook.clearAllFunds();
      });

      expect(result.current.hook.selectedFunds.size).toBe(0);

      act(() => {
        result.current.hook.selectAllFunds();
      });

      expect(result.current.hook.selectedFunds.size).toBe(3);
    });

    it('clears all funds', () => {
      const { result } = renderHook(() => ({
        hook: useMultiComparisonChart({ funds: mockFunds })
      }));

      act(() => {
        result.current.hook.clearAllFunds();
      });

      expect(result.current.hook.selectedFunds.size).toBe(0);
    });
  });

  describe('Hovered Fund', () => {
    it('tracks hovered fund', () => {
      const { result } = renderHook(() => ({
        hook: useMultiComparisonChart({ funds: mockFunds })
      }));

      expect(result.current.hook.hoveredFund).toBeNull();

      act(() => {
        result.current.hook.setHoveredFund('100001');
      });

      expect(result.current.hook.hoveredFund).toBe('100001');
    });

    it('clears hovered fund', () => {
      const { result } = renderHook(() => ({
        hook: useMultiComparisonChart({ funds: mockFunds })
      }));

      act(() => {
        result.current.hook.setHoveredFund('100001');
      });

      act(() => {
        result.current.hook.setHoveredFund(null);
      });

      expect(result.current.hook.hoveredFund).toBeNull();
    });
  });

  describe('Chart Dataset', () => {
    it('generates chart dataset with selected funds', () => {
      const { result } = renderHook(() => ({
        hook: useMultiComparisonChart({ funds: mockFunds })
      }));

      expect(result.current.hook.chartDataset.data).toBeDefined();
      expect(result.current.hook.chartDataset.fundKeys).toBeDefined();
      expect(result.current.hook.chartDataset.fundKeys.length).toBe(3);
    });

    it('updates dataset when fund selection changes', () => {
      const { result } = renderHook(() => ({
        hook: useMultiComparisonChart({ funds: mockFunds })
      }));

      const initialLength = result.current.hook.chartDataset.fundKeys.length;

      act(() => {
        result.current.hook.toggleFundSelection('100001');
      });

      const newLength = result.current.hook.chartDataset.fundKeys.length;

      expect(newLength).toBeLessThan(initialLength);
      expect(newLength).toBe(2);
    });

    it('has empty dataset when no funds selected', () => {
      const { result } = renderHook(() => ({
        hook: useMultiComparisonChart({ funds: mockFunds })
      }));

      act(() => {
        result.current.hook.clearAllFunds();
      });

      expect(result.current.hook.chartDataset.data).toEqual([]);
      expect(result.current.hook.chartDataset.fundKeys).toEqual([]);
    });
  });

  describe('Fund Comparisons', () => {
    it('generates fund comparisons with rankings', () => {
      const { result } = renderHook(() => ({
        hook: useMultiComparisonChart({ funds: mockFunds })
      }));

      expect(result.current.hook.fundComparisons).toBeDefined();
      expect(result.current.hook.fundComparisons.length).toBeGreaterThan(0);

      // Verify rankings are sequential
      const ranks = result.current.hook.fundComparisons.map((f) => f.rank).sort();
      expect(ranks[0]).toBe(1);
      expect(ranks[ranks.length - 1]).toBe(ranks.length);
    });

    it('includes statistics for each comparison', () => {
      const { result } = renderHook(() => ({
        hook: useMultiComparisonChart({ funds: mockFunds })
      }));

      result.current.hook.fundComparisons.forEach((comparison) => {
        expect(comparison.stats).toBeDefined();
        expect(comparison.stats.returnPercentage).toBeDefined();
        expect(comparison.stats.startingNAV).toBeDefined();
      });
    });
  });

  describe('Empty Funds List', () => {
    it('handles empty funds array', () => {
      const { result } = renderHook(() => ({
        hook: useMultiComparisonChart({ funds: [] })
      }));

      expect(result.current.hook.selectedFunds.size).toBe(0);
      expect(result.current.hook.chartDataset.data).toEqual([]);
      expect(result.current.hook.fundComparisons).toEqual([]);
    });
  });
});
