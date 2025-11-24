'use client';

/**
 * Risk-Return Scatter Plot Component
 * Visualizes the relationship between fund volatility (risk) and returns
 * Uses a scatter chart to help investors understand risk-adjusted performance
 */

import React, { useMemo, useState } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';
import type { FundPreview } from '@/lib/types';

interface RiskReturnData extends FundPreview {
  volatility: number; // Standard deviation as risk measure
  return: number;     // Annual return percentage
  sharpeRatio?: number;
  color?: string;
}

interface RiskReturnScatterProps {
  funds: RiskReturnData[];
  loading?: boolean;
  height?: number;
  period?: '1Y' | '3Y' | '5Y';
  onFundSelect?: (fund: RiskReturnData) => void;
}

const getRiskColor = (volatility: number, returns: number) => {
  // Color coding based on risk level
  if (volatility < 5) return '#10b981'; // Green - low risk
  if (volatility < 10) return '#3b82f6'; // Blue - moderate risk
  if (volatility < 15) return '#f59e0b'; // Amber - higher risk
  return '#ef4444'; // Red - high risk
};

export default function RiskReturnScatter({
  funds,
  loading = false,
  height = 500,
  period = '5Y',
  onFundSelect
}: RiskReturnScatterProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Prepare data with colors
  const chartData = useMemo(() => {
    return funds.map(fund => ({
      ...fund,
      color: getRiskColor(fund.volatility, fund.return),
      // Ensure volatility and return are numbers
      volatility: Number(fund.volatility) || 0,
      return: Number(fund.return) || 0
    }));
  }, [funds]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (chartData.length === 0) {
      return { avgVolatility: 0, avgReturn: 0, maxVolatility: 0, maxReturn: 0 };
    }

    const volatilities = chartData.map(f => f.volatility);
    const fundReturns = chartData.map(f => f.return);

    return {
      avgVolatility: volatilities.reduce((a, b) => a + b, 0) / volatilities.length,
      avgReturn: fundReturns.reduce((a, b) => a + b, 0) / fundReturns.length,
      maxVolatility: Math.max(...volatilities),
      maxReturn: Math.max(...fundReturns)
    };
  }, [chartData]);

  // Filter data if category selected
  const filteredData = selectedCategory
    ? chartData.filter(f => f.schemeCategory === selectedCategory)
    : chartData;

  // Get unique categories for legend
  const categories = Array.from(
    new Set(chartData.map(f => f.schemeCategory).filter(Boolean))
  ) as string[];

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <p className="mt-2 text-gray-600">Loading risk-return analysis...</p>
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
    <div className="space-y-4">
      {/* Statistics Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-600 mb-1">Avg. Risk (Volatility)</p>
          <p className="text-lg font-bold text-gray-900">{stats.avgVolatility.toFixed(2)}%</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-600 mb-1">Avg. Return ({period})</p>
          <p className="text-lg font-bold text-gray-900">{stats.avgReturn.toFixed(2)}%</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-600 mb-1">Max Risk</p>
          <p className="text-lg font-bold text-gray-900">{stats.maxVolatility.toFixed(2)}%</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-600 mb-1">Max Return ({period})</p>
          <p className="text-lg font-bold text-gray-900">{stats.maxReturn.toFixed(2)}%</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold mb-4">Risk vs Return ({period})</h3>

        <ResponsiveContainer width="100%" height={height}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="volatility"
              name="Risk (Volatility %)"
              label={{ value: 'Risk (Volatility %)', position: 'insideBottomRight', offset: -5 }}
              type="number"
            />
            <YAxis
              dataKey="return"
              name={`Return (${period})`}
              label={{ value: `Return (${period} %)`, angle: -90, position: 'insideLeft' }}
              type="number"
            />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as RiskReturnData;
                  return (
                    <div className="bg-white border border-gray-300 rounded-lg p-3 shadow-lg">
                      <p className="font-semibold text-sm">{data.schemeName}</p>
                      <p className="text-xs text-gray-600">{data.schemeCategory}</p>
                      <p className="text-sm mt-2">
                        <span className="font-medium">Risk:</span> {data.volatility.toFixed(2)}%
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Return:</span> {data.return.toFixed(2)}%
                      </p>
                      {data.sharpeRatio && (
                        <p className="text-sm">
                          <span className="font-medium">Sharpe:</span> {data.sharpeRatio.toFixed(2)}
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine
              x={stats.avgVolatility}
              stroke="#9ca3af"
              strokeDasharray="5 5"
              label={{ value: 'Avg Risk', position: 'top', fill: '#6b7280', fontSize: 12 }}
            />
            <ReferenceLine
              y={stats.avgReturn}
              stroke="#9ca3af"
              strokeDasharray="5 5"
              label={{ value: 'Avg Return', position: 'right', fill: '#6b7280', fontSize: 12 }}
            />
            <Scatter name="Funds" data={filteredData} fill="#8884d8">
              {filteredData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  onClick={() => onFundSelect?.(entry)}
                  style={{ cursor: 'pointer' }}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-semibold mb-3">Filter by Category</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === null
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Categories
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Information Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-gray-700">
          <strong>📊 Understanding the Chart:</strong> Each dot represents a fund. Position on the X-axis shows risk
          (volatility), while position on the Y-axis shows returns. Lower-left dots are lower risk/lower return;
          upper-right dots are higher risk/higher potential return. The reference lines show averages.
        </p>
      </div>
    </div>
  );
}
