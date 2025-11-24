'use client';

import React, { useMemo, useState } from 'react';
import { useHeatmapData, useCategoryRanking, useCategoryStats, CategoryPerformance } from '@/hooks/useHeatmapData';
import { getReturnColor, formatPercentage, getPerformanceLevel, getCellStyles } from '@/lib/heatmap-colors';
import { useToast } from '@/app/contexts/ToastContext';

interface CategoryHeatmapProps {
  funds: Array<{
    schemeCode: string;
    schemeName: string;
    schemeCategory: string;
    expenseRatio?: number;
    returns?: {
      oneYear?: number;
      threeYear?: number;
      fiveYear?: number;
    };
  }>;
  loading?: boolean;
}

export default function CategoryHeatmap({ funds, loading = false }: CategoryHeatmapProps) {
  const { addToast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState<'oneYear' | 'threeYear' | 'fiveYear'>('oneYear');
  const [viewMode, setViewMode] = useState<'heatmap' | 'table'>('heatmap');

  const categoryPerformance = useHeatmapData(funds);
  const rankedCategories = useCategoryRanking(categoryPerformance, selectedPeriod);
  const stats = useCategoryStats(categoryPerformance);

  const handlePeriodChange = (period: 'oneYear' | 'threeYear' | 'fiveYear') => {
    setSelectedPeriod(period);
  };

  const handleViewModeChange = (mode: 'heatmap' | 'table') => {
    setViewMode(mode);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-64 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  if (categoryPerformance.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
        <p className="text-gray-600">No fund data available for heatmap</p>
      </div>
    );
  }

  const getPeriodLabel = (): string => {
    switch (selectedPeriod) {
      case 'oneYear':
        return '1-Year';
      case 'threeYear':
        return '3-Year';
      case 'fiveYear':
        return '5-Year';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Category Performance Heatmap</h2>
            <p className="text-sm text-gray-600 mt-2">
              Average CAGR by fund category across different time periods
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleViewModeChange('heatmap')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'heatmap'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Heatmap
            </button>
            <button
              onClick={() => handleViewModeChange('table')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Table
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['oneYear', 'threeYear', 'fiveYear'].map((period) => (
            <button
              key={period}
              onClick={() => handlePeriodChange(period as typeof selectedPeriod)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedPeriod === period
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {period === 'oneYear' ? '1Y' : period === 'threeYear' ? '3Y' : '5Y'}
            </button>
          ))}
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Best Category"
            value={stats.bestCategory?.category || 'N/A'}
            return={stats.bestCategory?.returns[selectedPeriod] || 0}
          />
          <StatCard
            label="Worst Category"
            value={stats.worstCategory?.category || 'N/A'}
            return={stats.worstCategory?.returns[selectedPeriod] || 0}
          />
          <StatCard
            label="Average Return"
            value="Across Categories"
            return={stats.avgCategoryReturn[selectedPeriod]}
          />
          <StatCard
            label="Total Funds"
            value={stats.totalFunds.toString()}
            return={undefined}
          />
        </div>

        {/* Heatmap View */}
        {viewMode === 'heatmap' && <HeatmapView categories={rankedCategories} period={selectedPeriod} />}

        {/* Table View */}
        {viewMode === 'table' && <TableView categories={categoryPerformance} />}

        {/* Disclaimer */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Disclaimer:</strong> Past performance is not indicative of future results. These
            returns are averages across fund categories and do not constitute investment advice.
            Please consult a financial advisor before making investment decisions.
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  return: returnValue
}: {
  label: string;
  value: string;
  return?: number;
}) {
  const { color } = returnValue !== undefined ? getReturnColor(returnValue) : { color: '#f3f4f6' };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4">
      <p className="text-xs font-medium text-gray-600 uppercase mb-2">{label}</p>
      <p className="text-lg font-bold text-gray-900 mb-2">{value}</p>
      {returnValue !== undefined && (
        <p className="text-sm font-semibold" style={{ color }}>
          {formatPercentage(returnValue)}
        </p>
      )}
    </div>
  );
}

interface RankedCategory extends CategoryPerformance {
  rank: number;
}

interface HeatmapViewProps {
  categories: RankedCategory[];
  period: 'oneYear' | 'threeYear' | 'fiveYear';
}

function HeatmapView({ categories, period }: HeatmapViewProps) {
  return (
    <div className="overflow-x-auto">
      <div className="grid gap-3">
        {categories.map((category) => (
          <div key={category.category} className="flex items-center gap-4">
            {/* Category Name */}
            <div className="w-32 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 w-6">#{category.rank}</span>
                <p className="font-medium text-gray-900">{category.category}</p>
              </div>
              <p className="text-xs text-gray-500 mt-1">{category.fundCount} funds</p>
            </div>

            {/* Heatmap Bar */}
            <div className="flex-1">
              <div
                className="h-12 rounded-lg flex items-center justify-center transition-all duration-200 hover:shadow-md"
                style={getCellStyles(category.returns[period])}
              >
                <span className="font-bold text-sm">
                  {formatPercentage(category.returns[period])}
                </span>
              </div>
            </div>

            {/* Performance Label */}
            <div className="w-24 text-right flex-shrink-0">
              <p className="text-sm font-semibold text-gray-700">
                {getPerformanceLevel(category.returns[period])}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface TableViewProps {
  categories: CategoryPerformance[];
}

function TableView({ categories }: TableViewProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">1-Year CAGR</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">3-Year CAGR</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">5-Year CAGR</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Avg Expense Ratio</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Funds Count</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {categories.map((category) => (
            <tr key={category.category} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-sm font-medium text-gray-900">{category.category}</td>
              <td
                className="px-4 py-3 text-right text-sm font-semibold rounded"
                style={{
                  ...getCellStyles(category.returns.oneYear),
                  padding: '0.75rem'
                }}
              >
                {formatPercentage(category.returns.oneYear)}
              </td>
              <td
                className="px-4 py-3 text-right text-sm font-semibold rounded"
                style={{
                  ...getCellStyles(category.returns.threeYear),
                  padding: '0.75rem'
                }}
              >
                {formatPercentage(category.returns.threeYear)}
              </td>
              <td
                className="px-4 py-3 text-right text-sm font-semibold rounded"
                style={{
                  ...getCellStyles(category.returns.fiveYear),
                  padding: '0.75rem'
                }}
              >
                {formatPercentage(category.returns.fiveYear)}
              </td>
              <td className="px-4 py-3 text-right text-sm text-gray-600">
                {category.avgExpenseRatio.toFixed(2)}%
              </td>
              <td className="px-4 py-3 text-right text-sm text-gray-600">{category.fundCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
