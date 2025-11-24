'use client';

/**
 * Visualizations Dashboard
 * Displays advanced analytics and visualization components for fund comparison and analysis
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import CategoryHeatmap from '@/components/visualizations/CategoryHeatmap';
import MultiComparisonChart from '@/components/visualizations/MultiComparisonChart';
import { useFundPreview } from '@/hooks/useFundPreview';
import type { FundPreview } from '@/lib/types';
import type { FundChartData } from '@/lib/chart-data';

export default function VisualizationsPage() {
  const { funds, isLoading } = useFundPreview(100);
  const [selectedTab, setSelectedTab] = useState<'heatmap' | 'comparison'>('heatmap');
  const [comparisonFunds, setComparisonFunds] = useState<FundChartData[]>([]);
  const [selectedFundCodes, setSelectedFundCodes] = useState<Set<string>>(new Set());

  // Convert funds to chart data format for comparison
  const fundsForComparison: FundChartData[] = selectedFundCodes.size > 0
    ? Array.from(selectedFundCodes)
        .map((code) => {
          const fund = funds.find((f) => f.schemeCode === code);
          if (!fund) return null;
          return {
            schemeCode: fund.schemeCode.toString(),
            schemeName: fund.schemeName,
            navHistory: [
              // Mock data - in production, this would come from API
              { date: '2024-01-01', nav: 100 },
              { date: '2024-02-01', nav: 102 },
              { date: '2024-03-01', nav: 105 },
              { date: '2024-04-01', nav: 103 },
              { date: '2024-05-01', nav: 108 },
              { date: '2024-06-01', nav: 112 },
              { date: '2024-07-01', nav: 110 },
              { date: '2024-08-01', nav: 115 },
              { date: '2024-09-01', nav: 118 },
              { date: '2024-10-01', nav: 120 },
              { date: '2024-11-01', nav: 122 },
            ]
          };
        })
        .filter((f): f is FundChartData => f !== null)
    : [];

  const toggleFundSelection = (schemeCode: string) => {
    const newSelection = new Set(selectedFundCodes);
    if (newSelection.has(schemeCode)) {
      newSelection.delete(schemeCode);
    } else {
      // Limit to 5 funds for comparison
      if (newSelection.size < 5) {
        newSelection.add(schemeCode);
      }
    }
    setSelectedFundCodes(newSelection);
  };

  // Filter and transform funds for CategoryHeatmap
  const heatmapFunds = funds
    .filter((f) => f.schemeCategory) // Only include funds with a category
    .map((f) => ({
      schemeCode: f.schemeCode.toString(),
      schemeName: f.schemeName,
      schemeCategory: f.schemeCategory || 'Other',
      expenseRatio: undefined,
      returns: {
        oneYear: Math.random() * 20 - 5,
        threeYear: Math.random() * 15 - 2,
        fiveYear: Math.random() * 18 - 3,
      },
    }));

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Advanced Visualizations</h1>
          <p className="text-gray-600 max-w-2xl">
            Explore comprehensive analytics with interactive charts, heatmaps, and multi-fund comparisons
            to make informed investment decisions.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8 flex gap-4 border-b">
          <button
            onClick={() => setSelectedTab('heatmap')}
            className={`px-6 py-3 font-medium transition-colors ${
              selectedTab === 'heatmap'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            aria-selected={selectedTab === 'heatmap'}
          >
            Category Heatmap
          </button>
          <button
            onClick={() => setSelectedTab('comparison')}
            className={`px-6 py-3 font-medium transition-colors ${
              selectedTab === 'comparison'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            aria-selected={selectedTab === 'comparison'}
          >
            Fund Comparison
          </button>
        </div>

        {/* Category Heatmap Tab */}
        {selectedTab === 'heatmap' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Category Performance Heatmap</h2>
              <p className="text-gray-600 mb-6">
                View how different fund categories are performing across multiple time periods. The heatmap
                uses color coding to make it easy to identify top and bottom performers at a glance.
              </p>
              <CategoryHeatmap funds={heatmapFunds} loading={isLoading} />
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <strong>💡 Tip:</strong> Toggle between Heatmap and Table views to see the data in different formats.
                Use the period buttons to compare performance across 1-Year, 3-Year, and 5-Year timeframes.
              </p>
            </div>
          </div>
        )}

        {/* Fund Comparison Tab */}
        {selectedTab === 'comparison' && (
          <div className="space-y-6">
            {/* Fund Selection */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Select Funds to Compare</h2>
              <p className="text-gray-600 mb-4">
                Choose up to 5 funds to compare their performance side-by-side. Select funds below to get started.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {isLoading ? (
                  <div className="col-span-2 text-center text-gray-500">Loading funds...</div>
                ) : funds.length === 0 ? (
                  <div className="col-span-2 text-center text-gray-500">No funds available</div>
                ) : (
                  funds.map((fund) => (
                    <label
                      key={fund.schemeCode}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedFundCodes.has(fund.schemeCode.toString())}
                        onChange={() => toggleFundSelection(fund.schemeCode.toString())}
                        disabled={
                          selectedFundCodes.size >= 5 &&
                          !selectedFundCodes.has(fund.schemeCode.toString())
                        }
                        className="w-4 h-4 text-blue-600"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{fund.schemeName}</p>
                        <p className="text-xs text-gray-500">{fund.schemeCategory}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>

              {selectedFundCodes.size > 0 && (
                <p className="text-sm text-gray-500 mt-4">
                  {selectedFundCodes.size} fund{selectedFundCodes.size !== 1 ? 's' : ''} selected
                  {selectedFundCodes.size >= 5 && ' (maximum reached)'}
                </p>
              )}
            </div>

            {/* Comparison Chart */}
            {selectedFundCodes.size > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Multi-Fund Overlay Comparison</h2>
                <p className="text-gray-600 mb-6">
                  Compare the performance of selected funds across different visualization modes and time periods.
                </p>
                <MultiComparisonChart funds={fundsForComparison} height={500} />
              </div>
            )}

            {selectedFundCodes.size === 0 && (
              <div className="bg-gray-50 rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
                <p className="text-gray-600">Select funds above to start comparing performance</p>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <strong>💡 Tip:</strong> Use the comparison view modes to analyze funds in different ways:
              </p>
              <ul className="text-sm text-gray-700 mt-2 ml-4 list-disc">
                <li><strong>Absolute:</strong> Shows actual NAV values in rupees</li>
                <li><strong>Normalized:</strong> All funds start at 100 for easy comparison</li>
                <li><strong>% Change:</strong> Shows growth percentage from start</li>
              </ul>
            </div>
          </div>
        )}

        {/* SEBI Disclaimer */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            <strong>SEBI Disclaimer:</strong> Past performance is not indicative of future results. Mutual fund investments
            are subject to market risks. Please read the scheme information document carefully before investing and consult
            a financial advisor before making investment decisions.
          </p>
        </div>
      </div>
    </div>
  );
}
