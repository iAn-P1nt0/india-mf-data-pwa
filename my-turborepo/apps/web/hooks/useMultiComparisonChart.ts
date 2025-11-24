/**
 * Hook for managing multi-fund overlay comparison chart state and logic
 */

import { useState, useMemo, useCallback } from 'react';
import {
  FundChartData,
  ChartViewMode,
  ChartPoint,
  createChartDataset,
  compareFunds,
  filterByDateRange,
  getDateRangePreset
} from '@/lib/chart-data';

export interface UseMultiComparisonChartOptions {
  funds: FundChartData[];
  initialViewMode?: ChartViewMode;
  initialPeriod?: 'oneMonth' | 'threeMonths' | 'sixMonths' | 'oneYear' | 'threeYears' | 'fiveYears' | 'tenYears';
}

export function useMultiComparisonChart(options: UseMultiComparisonChartOptions) {
  const { funds, initialViewMode = 'absolute', initialPeriod = 'oneYear' } = options;

  // State management
  const [viewMode, setViewMode] = useState<ChartViewMode>(initialViewMode);
  const [selectedPeriod, setSelectedPeriod] = useState(initialPeriod);
  const [hoveredFund, setHoveredFund] = useState<string | null>(null);
  const [selectedFunds, setSelectedFunds] = useState<Set<string>>(
    new Set(funds.map((f) => f.schemeCode))
  );

  // Memoized chart dataset
  const chartDataset = useMemo(() => {
    // Filter to selected funds
    const activeFunds = funds.filter((f) => selectedFunds.has(f.schemeCode));
    if (activeFunds.length === 0) return { data: [], fundKeys: [] };

    // Get date range preset
    const dateRange = getDateRangePreset(selectedPeriod);

    // Filter fund data by date range
    const filteredFunds = activeFunds.map((fund) => ({
      ...fund,
      navHistory: filterByDateRange(fund.navHistory, dateRange.startDate, dateRange.endDate)
    }));

    // Create chart dataset with transformations
    return createChartDataset(filteredFunds, viewMode);
  }, [funds, selectedFunds, viewMode, selectedPeriod]);

  // Memoized fund comparisons
  const fundComparisons = useMemo(() => {
    const activeFunds = funds.filter((f) => selectedFunds.has(f.schemeCode));
    return compareFunds(activeFunds);
  }, [funds, selectedFunds]);

  // Callbacks
  const handleViewModeChange = useCallback((mode: ChartViewMode) => {
    setViewMode(mode);
  }, []);

  const handlePeriodChange = useCallback(
    (period: 'oneMonth' | 'threeMonths' | 'sixMonths' | 'oneYear' | 'threeYears' | 'fiveYears' | 'tenYears') => {
      setSelectedPeriod(period);
    },
    []
  );

  const toggleFundSelection = useCallback((schemeCode: string) => {
    setSelectedFunds((prev) => {
      const next = new Set(prev);
      if (next.has(schemeCode)) {
        next.delete(schemeCode);
      } else {
        next.add(schemeCode);
      }
      return next;
    });
  }, []);

  const selectAllFunds = useCallback(() => {
    setSelectedFunds(new Set(funds.map((f) => f.schemeCode)));
  }, [funds]);

  const clearAllFunds = useCallback(() => {
    setSelectedFunds(new Set());
  }, []);

  return {
    chartDataset,
    fundComparisons,
    viewMode,
    selectedPeriod,
    selectedFunds,
    hoveredFund,
    setHoveredFund,
    handleViewModeChange,
    handlePeriodChange,
    toggleFundSelection,
    selectAllFunds,
    clearAllFunds
  };
}
