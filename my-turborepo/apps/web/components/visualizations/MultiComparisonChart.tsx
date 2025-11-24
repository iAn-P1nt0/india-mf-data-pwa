'use client';

/**
 * Multi-Fund Overlay Comparison Chart Component
 * Displays normalized, absolute, or percentage-change views of multiple funds' NAV history
 */

import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
  AreaChart
} from 'recharts';
import { format } from 'date-fns';
import { FundChartData, formatChartValue, formatChartDate } from '@/lib/chart-data';
import { useMultiComparisonChart } from '@/hooks/useMultiComparisonChart';

export interface MultiComparisonChartProps {
  funds: FundChartData[];
  title?: string;
  height?: number;
  showLegend?: boolean;
  showTooltip?: boolean;
  loading?: boolean;
}

export default function MultiComparisonChart({
  funds,
  title = 'Fund Comparison',
  height = 400,
  showLegend = true,
  showTooltip = true,
  loading = false
}: MultiComparisonChartProps) {
  const {
    chartDataset,
    fundComparisons,
    viewMode,
    selectedPeriod,
    selectedFunds,
    hoveredFund,
    setHoveredFund,
    handleViewModeChange,
    handlePeriodChange,
    toggleFundSelection
  } = useMultiComparisonChart({
    funds,
    initialViewMode: 'absolute',
    initialPeriod: 'oneYear'
  });

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;

    const date = payload[0]?.payload?.date;
    if (!date) return null;

    return (
      <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
        <p className="text-sm font-semibold text-gray-800">{formatChartDate(date)}</p>
        {payload.map((entry: any, index: number) => {
          const fundCode = entry.dataKey.replace('nav_', '');
          const fund = funds.find((f) => f.schemeCode === fundCode);
          return (
            <p key={index} style={{ color: entry.color }} className="text-xs">
              {fund?.schemeName.substring(0, 20)}: {formatChartValue(entry.value, viewMode)}
            </p>
          );
        })}
      </div>
    );
  };

  const activeFunds = useMemo(
    () => fundComparisons.filter((f) => selectedFunds.has(f.schemeCode)),
    [fundComparisons, selectedFunds]
  );

  // Render loading state
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="h-96 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  // Render empty state
  if (funds.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-center text-gray-500">No funds selected for comparison</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-sm text-gray-600">
          {activeFunds.length} fund{activeFunds.length !== 1 ? 's' : ''} selected • {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} view
        </p>
      </div>

      {/* Controls */}
      <div className="mb-6 space-y-4">
        {/* View Mode Selector */}
        <div className="flex flex-wrap gap-2">
          <label className="text-sm font-semibold text-gray-700">View Mode:</label>
          <div className="flex gap-2">
            <button
              onClick={() => handleViewModeChange('absolute')}
              className={`px-3 py-1 text-sm rounded ${
                viewMode === 'absolute'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
              aria-pressed={viewMode === 'absolute'}
            >
              Absolute
            </button>
            <button
              onClick={() => handleViewModeChange('normalized')}
              className={`px-3 py-1 text-sm rounded ${
                viewMode === 'normalized'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
              aria-pressed={viewMode === 'normalized'}
            >
              Normalized (100)
            </button>
            <button
              onClick={() => handleViewModeChange('percentage')}
              className={`px-3 py-1 text-sm rounded ${
                viewMode === 'percentage'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
              aria-pressed={viewMode === 'percentage'}
            >
              % Change
            </button>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex flex-wrap gap-2">
          <label className="text-sm font-semibold text-gray-700">Period:</label>
          <div className="flex gap-2 flex-wrap">
            {['oneMonth', 'threeMonths', 'sixMonths', 'oneYear', 'threeYears', 'fiveYears'].map((period) => (
              <button
                key={period}
                onClick={() =>
                  handlePeriodChange(
                    period as 'oneMonth' | 'threeMonths' | 'sixMonths' | 'oneYear' | 'threeYears' | 'fiveYears'
                  )
                }
                className={`px-3 py-1 text-sm rounded ${
                  selectedPeriod === period
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
                aria-pressed={selectedPeriod === period}
              >
                {period === 'oneMonth'
                  ? '1M'
                  : period === 'threeMonths'
                    ? '3M'
                    : period === 'sixMonths'
                      ? '6M'
                      : period === 'oneYear'
                        ? '1Y'
                        : period === 'threeYears'
                          ? '3Y'
                          : '5Y'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      {activeFunds.length > 0 ? (
        <div className="mb-6">
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={chartDataset.data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => format(new Date(date), 'MMM dd')}
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <YAxis
                tickFormatter={(value) => formatChartValue(value, viewMode).replace('₹', '').replace('%', '')}
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              {showTooltip && <Tooltip content={<CustomTooltip />} />}
              {showLegend && <Legend />}

              {chartDataset.fundKeys.map((fund, index) => (
                <Line
                  key={fund.code}
                  type="monotone"
                  dataKey={`nav_${fund.code}`}
                  stroke={fund.color}
                  strokeWidth={hoveredFund === fund.code ? 3 : 2}
                  dot={false}
                  isAnimationActive={true}
                  onMouseEnter={() => setHoveredFund(fund.code)}
                  onMouseLeave={() => setHoveredFund(null)}
                  opacity={!hoveredFund || hoveredFund === fund.code ? 1 : 0.3}
                  name={fund.name}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-96 bg-gray-50 rounded flex items-center justify-center">
          <p className="text-gray-500">Please select at least one fund to display</p>
        </div>
      )}

      {/* Fund Selection */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Select Funds:</h3>
        <div className="space-y-2">
          {fundComparisons.map((fund) => (
            <label key={fund.schemeCode} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
              <input
                type="checkbox"
                checked={selectedFunds.has(fund.schemeCode)}
                onChange={() => toggleFundSelection(fund.schemeCode)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{fund.schemeName}</p>
                <p className="text-xs text-gray-500">
                  Return: <span className={fund.stats.returnPercentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {fund.stats.returnPercentage >= 0 ? '+' : ''}{fund.stats.returnPercentage.toFixed(2)}%
                  </span>
                </p>
              </div>
              <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded">
                #{fund.rank}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* SEBI Disclaimer */}
      <div className="mt-6 pt-6 border-t border-gray-200 bg-blue-50 p-3 rounded text-xs text-gray-700">
        <p className="font-semibold mb-1">SEBI Disclaimer</p>
        <p>
          Past performance is not indicative of future results. Mutual fund investments are subject to market risks. Please read the scheme information document carefully before investing.
        </p>
      </div>
    </div>
  );
}
