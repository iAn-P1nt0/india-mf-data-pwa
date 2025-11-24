/**
 * Chart Data Transformation Utilities for Multi-Fund Overlay Comparison
 * Handles data normalization, aggregation, and formatting for Recharts visualizations
 */

import { format, subMonths, eachDayOfInterval } from 'date-fns';
import { groupBy, meanBy, minBy, maxBy } from 'lodash';

export interface NAVData {
  date: string;
  nav: number;
}

export interface FundChartData {
  schemeCode: string;
  schemeName: string;
  navHistory: NAVData[];
  color?: string;
}

export interface ChartPoint {
  date: string;
  timestamp: number;
  [fundKey: string]: number | string | null;
}

export interface NormalizedChartPoint extends ChartPoint {
  [fundKey: string]: number | string;
}

/**
 * View modes for comparison charts
 */
export type ChartViewMode = 'absolute' | 'normalized' | 'percentage';

/**
 * Normalize NAV data to start at 100
 * Useful for comparing funds with different starting NAVs
 */
export function normalizeNAVData(navHistory: NAVData[]): NAVData[] {
  if (navHistory.length === 0) return [];

  const startingNAV = navHistory[0]!.nav;
  if (startingNAV === 0) return navHistory;

  return navHistory.map((point) => ({
    ...point,
    nav: (point.nav / startingNAV) * 100
  }));
}

/**
 * Calculate percentage change from starting NAV
 */
export function calculatePercentageChange(navHistory: NAVData[]): NAVData[] {
  if (navHistory.length === 0) return [];

  const startingNAV = navHistory[0]!.nav;
  if (startingNAV === 0) return navHistory;

  return navHistory.map((point) => ({
    ...point,
    nav: ((point.nav - startingNAV) / startingNAV) * 100
  }));
}

/**
 * Merge multiple funds' NAV histories into a single dataset for charting
 * Aligns dates and fills missing values
 */
export function mergeNAVHistories(funds: FundChartData[], viewMode: ChartViewMode = 'absolute'): ChartPoint[] {
  if (funds.length === 0) return [];

  // Transform data based on view mode
  const transformedFunds = funds.map((fund) => {
    const history =
      viewMode === 'normalized'
        ? normalizeNAVData(fund.navHistory)
        : viewMode === 'percentage'
          ? calculatePercentageChange(fund.navHistory)
          : fund.navHistory;

    return {
      ...fund,
      navHistory: history
    };
  });

  // Find date range from all funds
  const allDates = transformedFunds
    .flatMap((f) => f.navHistory.map((n) => new Date(n.date)))
    .sort((a, b) => a.getTime() - b.getTime());

  if (allDates.length === 0) return [];

  const startDate = allDates[0]!;
  const endDate = allDates[allDates.length - 1]!;

  // Create a unified date array
  const unifiedDates = eachDayOfInterval({ start: startDate, end: endDate });

  // Build chart points with data from all funds
  return unifiedDates.map((date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const point: ChartPoint = {
      date: dateStr,
      timestamp: date.getTime()
    };

    // Add NAV data for each fund
    transformedFunds.forEach((fund) => {
      const navData = fund.navHistory.find((n) => n.date === dateStr);
      point[`nav_${fund.schemeCode}`] = navData?.nav ?? null;
    });

    return point;
  });
}

/**
 * Create a dataset optimized for Recharts with explicit fund keys
 */
export function createChartDataset(funds: FundChartData[], viewMode: ChartViewMode = 'absolute'): {
  data: ChartPoint[];
  fundKeys: Array<{ code: string; name: string; color: string }>;
} {
  const mergedData = mergeNAVHistories(funds, viewMode);

  const fundKeys = funds.map((fund) => ({
    code: fund.schemeCode,
    name: fund.schemeName,
    color: fund.color || getDefaultColor(funds.indexOf(fund))
  }));

  return {
    data: mergedData,
    fundKeys
  };
}

/**
 * Generate default colors for funds
 */
export function getDefaultColor(index: number): string {
  const colors = [
    '#3b82f6', // Blue
    '#ef4444', // Red
    '#10b981', // Green
    '#f59e0b', // Amber
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#f97316'  // Orange
  ];

  return colors[index % colors.length]!;
}

/**
 * Calculate performance statistics for a fund
 */
export interface PerformanceStats {
  startingNAV: number;
  endingNAV: number;
  totalReturn: number;
  returnPercentage: number;
  avgNAV: number;
  minNAV: number;
  maxNAV: number;
  volatility: number;
  daysInPeriod: number;
}

export function calculatePerformanceStats(navHistory: NAVData[]): PerformanceStats {
  if (navHistory.length === 0) {
    return {
      startingNAV: 0,
      endingNAV: 0,
      totalReturn: 0,
      returnPercentage: 0,
      avgNAV: 0,
      minNAV: 0,
      maxNAV: 0,
      volatility: 0,
      daysInPeriod: 0
    };
  }

  const navs = navHistory.map((n) => n.nav);
  const startingNAV = navs[0]!;
  const endingNAV = navs[navs.length - 1]!;
  const totalReturn = endingNAV - startingNAV;
  const returnPercentage = startingNAV !== 0 ? (totalReturn / startingNAV) * 100 : 0;

  const avgNAV = meanBy(navHistory, 'nav');
  const minNAV = minBy(navHistory, 'nav')?.nav || 0;
  const maxNAV = maxBy(navHistory, 'nav')?.nav || 0;

  // Calculate volatility (standard deviation)
  const mean = avgNAV;
  const variance = meanBy(navHistory, (n) => Math.pow(n.nav - mean, 2));
  const volatility = Math.sqrt(variance);

  return {
    startingNAV,
    endingNAV,
    totalReturn,
    returnPercentage,
    avgNAV,
    minNAV,
    maxNAV,
    volatility,
    daysInPeriod: navHistory.length - 1
  };
}

/**
 * Format chart data for tooltip display
 */
export function formatChartValue(value: number | null, viewMode: ChartViewMode): string {
  if (value === null || isNaN(value)) return 'N/A';

  if (viewMode === 'normalized' || viewMode === 'percentage') {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  }

  return `₹${value.toFixed(2)}`;
}

/**
 * Get a formatted date string for display
 */
export function formatChartDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return format(date, 'MMM dd, yyyy');
  } catch {
    return dateStr;
  }
}

/**
 * Compare multiple funds across a time period
 */
export interface FundComparison {
  schemeCode: string;
  schemeName: string;
  stats: PerformanceStats;
  rank: number;
}

export function compareFunds(funds: FundChartData[]): FundComparison[] {
  const comparisons = funds.map((fund) => ({
    schemeCode: fund.schemeCode,
    schemeName: fund.schemeName,
    stats: calculatePerformanceStats(fund.navHistory),
    rank: 0
  }));

  // Rank by return percentage (descending)
  comparisons.sort((a, b) => b.stats.returnPercentage - a.stats.returnPercentage);
  comparisons.forEach((c, i) => {
    c.rank = i + 1;
  });

  return comparisons;
}

/**
 * Filter data to a specific date range
 */
export function filterByDateRange(
  navHistory: NAVData[],
  startDate: Date,
  endDate: Date
): NAVData[] {
  return navHistory.filter((point) => {
    const date = new Date(point.date);
    return date >= startDate && date <= endDate;
  });
}

/**
 * Get predefined date ranges for quick selection
 */
export function getDateRangePreset(preset: 'oneMonth' | 'threeMonths' | 'sixMonths' | 'oneYear' | 'threeYears' | 'fiveYears' | 'tenYears'): { startDate: Date; endDate: Date; label: string } {
  const endDate = new Date();
  let startDate: Date;
  let label: string;

  switch (preset) {
    case 'oneMonth':
      startDate = subMonths(endDate, 1);
      label = '1 Month';
      break;
    case 'threeMonths':
      startDate = subMonths(endDate, 3);
      label = '3 Months';
      break;
    case 'sixMonths':
      startDate = subMonths(endDate, 6);
      label = '6 Months';
      break;
    case 'oneYear':
      startDate = subMonths(endDate, 12);
      label = '1 Year';
      break;
    case 'threeYears':
      startDate = subMonths(endDate, 36);
      label = '3 Years';
      break;
    case 'fiveYears':
      startDate = subMonths(endDate, 60);
      label = '5 Years';
      break;
    case 'tenYears':
      startDate = subMonths(endDate, 120);
      label = '10 Years';
      break;
    default:
      startDate = subMonths(endDate, 12);
      label = '1 Year';
  }

  return { startDate, endDate, label };
}
