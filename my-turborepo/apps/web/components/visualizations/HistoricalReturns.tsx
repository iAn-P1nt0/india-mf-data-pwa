'use client';

/**
 * Historical Returns Bar Chart Component
 * Displays fund returns across different time periods (1Y, 3Y, 5Y)
 * Compares performance across periods for easy analysis
 */

import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';
import type { FundPreview } from '@/lib/types';

interface ReturnsData extends FundPreview {
  oneYear: number;
  threeYear: number;
  fiveYear: number;
  tenYear?: number;
}

interface HistoricalReturnsProps {
  funds: ReturnsData[];
  loading?: boolean;
  height?: number;
  onFundSelect?: (fund: ReturnsData) => void;
}

const getReturnColor = (returnValue: number) => {
  if (returnValue >= 20) return '#059669'; // Dark green - excellent
  if (returnValue >= 15) return '#10b981'; // Green - good
  if (returnValue >= 10) return '#3b82f6'; // Blue - average
  if (returnValue >= 0) return '#f59e0b'; // Amber - below average
  return '#ef4444'; // Red - negative
};

export default function HistoricalReturns({
  funds,
  loading = false,
  height = 500,
  onFundSelect
}: HistoricalReturnsProps) {
  const [sortBy, setSortBy] = useState<'1Y' | '3Y' | '5Y' | '10Y'>('5Y');
  const [selectedFund, setSelectedFund] = useState<string | null>(null);

  // Prepare and sort data
  const chartData = useMemo(() => {
    const data = funds.map(fund => ({
      ...fund,
      code: String(fund.schemeCode),
      '1Y': Number(fund.oneYear) || 0,
      '3Y': Number(fund.threeYear) || 0,
      '5Y': Number(fund.fiveYear) || 0,
      '10Y': fund.tenYear ? Number(fund.tenYear) : undefined
    }));

    // Sort by selected period
    return data.sort((a, b) => {
      const periodKey = sortBy as '1Y' | '3Y' | '5Y' | '10Y';
      const aVal = a[periodKey] ?? 0;
      const bVal = b[periodKey] ?? 0;
      return bVal - aVal; // Descending order
    });
  }, [funds, sortBy]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (chartData.length === 0) return { avg1Y: 0, avg3Y: 0, avg5Y: 0, best5Y: 0, worst5Y: 0 };

    const returns1Y = chartData.map(f => f['1Y']);
    const returns3Y = chartData.map(f => f['3Y']);
    const returns5Y = chartData.map(f => f['5Y']);

    return {
      avg1Y: returns1Y.reduce((a, b) => a + b, 0) / returns1Y.length,
      avg3Y: returns3Y.reduce((a, b) => a + b, 0) / returns3Y.length,
      avg5Y: returns5Y.reduce((a, b) => a + b, 0) / returns5Y.length,
      best5Y: Math.max(...returns5Y),
      worst5Y: Math.min(...returns5Y)
    };
  }, [chartData]);

  // Limit to top 20 for chart clarity
  const displayData = chartData.slice(0, 20);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <p className="mt-2 text-gray-600">Loading historical returns...</p>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500">No fund data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-600 mb-1">Avg 1Y Return</p>
          <p className={`text-lg font-bold ${stats.avg1Y >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {stats.avg1Y.toFixed(2)}%
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-600 mb-1">Avg 3Y Return</p>
          <p className={`text-lg font-bold ${stats.avg3Y >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {stats.avg3Y.toFixed(2)}%
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-600 mb-1">Avg 5Y Return</p>
          <p className={`text-lg font-bold ${stats.avg5Y >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {stats.avg5Y.toFixed(2)}%
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-600 mb-1">Best 5Y Return</p>
          <p className="text-lg font-bold text-green-600">{stats.best5Y.toFixed(2)}%</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-600 mb-1">Worst 5Y Return</p>
          <p className="text-lg font-bold text-red-600">{stats.worst5Y.toFixed(2)}%</p>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-sm font-semibold mb-3">Sort by Period</p>
        <div className="flex gap-2">
          {['1Y', '3Y', '5Y', '10Y'].map(period => (
            <button
              key={period}
              onClick={() => setSortBy(period as '1Y' | '3Y' | '5Y' | '10Y')}
              disabled={period === '10Y' && !displayData.some(f => f['10Y'] !== undefined)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                sortBy === period
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Top {displayData.length} Funds by {sortBy} Returns</h3>

        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={displayData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="schemeName"
              angle={-45}
              textAnchor="end"
              height={100}
              interval={Math.ceil(displayData.length / 10)}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              label={{ value: 'Return (%)', angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as ReturnsData & { code: string; '1Y': number; '3Y': number; '5Y': number; '10Y'?: number };
                  return (
                    <div className="bg-white border border-gray-300 rounded-lg p-3 shadow-lg">
                      <p className="font-semibold text-sm">{data.schemeName}</p>
                      <p className="text-xs text-gray-600 mb-2">{data.schemeCategory}</p>
                      <p className="text-sm">
                        <span className="font-medium">1Y:</span> {data['1Y'].toFixed(2)}%
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">3Y:</span> {data['3Y'].toFixed(2)}%
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">5Y:</span> {data['5Y'].toFixed(2)}%
                      </p>
                      {data['10Y'] && (
                        <p className="text-sm">
                          <span className="font-medium">10Y:</span> {data['10Y'].toFixed(2)}%
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <ReferenceLine y={0} stroke="#000" />
            <Bar dataKey="1Y" fill="#3b82f6" name="1Y Return" />
            <Bar dataKey="3Y" fill="#8b5cf6" name="3Y Return" />
            <Bar dataKey="5Y" fill="#10b981" name="5Y Return" />
            {displayData.some(f => f['10Y'] !== undefined) && (
              <Bar dataKey="10Y" fill="#f59e0b" name="10Y Return" />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Information Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-gray-700">
          <strong>📊 Understanding Returns:</strong> CAGR (Compounded Annual Growth Rate) shows annualized returns
          over the period. 1Y = Last 12 months, 3Y = Last 3 years annualized, 5Y = Last 5 years annualized. Longer
          periods provide better perspective on fund performance.
        </p>
      </div>

      {/* SEBI Disclaimer */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-xs text-gray-700">
          <strong>⚠️ SEBI Disclaimer:</strong> Past performance is not indicative of future results. Returns shown are
          historical and subject to market conditions. Mutual fund investments are subject to market risks. Please
          read the scheme information document and consult a financial advisor before investing.
        </p>
      </div>
    </div>
  );
}
