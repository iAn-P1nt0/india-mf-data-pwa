'use client';

import React, { useState, useCallback } from 'react';
import { useCompareFunds } from '@/hooks/useCompareFunds';
import { useToast } from '@/app/contexts/ToastContext';
import { ChartSkeleton, MetricsSkeleton } from '@/components/common/Skeletons';

interface SelectedFund {
  schemeCode: string;
  schemeName: string;
}

export default function FundComparison() {
  const [selectedFunds, setSelectedFunds] = useState<SelectedFund[]>([]);
  const [schemeInput, setSchemeInput] = useState('');
  const { addToast } = useToast();

  const schemeCodes = selectedFunds.map((f) => f.schemeCode);
  const { data, isLoading, error } = useCompareFunds(schemeCodes);

  const handleAddFund = useCallback(() => {
    if (!schemeInput.trim()) {
      addToast('Please enter a scheme code or name', 'warning');
      return;
    }

    if (selectedFunds.some((f) => f.schemeCode === schemeInput)) {
      addToast('Fund already selected', 'warning');
      return;
    }

    if (selectedFunds.length >= 3) {
      addToast('Maximum 3 funds can be compared', 'warning');
      return;
    }

    const fund: SelectedFund = {
      schemeCode: schemeInput,
      schemeName: schemeInput
    };

    setSelectedFunds((prev) => [...prev, fund]);
    addToast(`Fund ${schemeInput} added to comparison`, 'success');
    setSchemeInput('');
  }, [selectedFunds, schemeInput, addToast]);

  const handleRemoveFund = useCallback((schemeCode: string) => {
    setSelectedFunds((prev) =>
      prev.filter((f) => f.schemeCode !== schemeCode)
    );
    addToast('Fund removed from comparison', 'info');
  }, [addToast]);

  const handleClearAll = useCallback(() => {
    setSelectedFunds([]);
    addToast('All funds cleared', 'info');
  }, [addToast]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-bold mb-4">Compare Funds</h2>
        <p className="text-gray-600 mb-4">
          Enter scheme codes (e.g., 119551) to compare up to 3 funds side-by-side
        </p>

        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter scheme code or fund name"
              value={schemeInput}
              onChange={(e) => setSchemeInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddFund()}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleAddFund}
              disabled={selectedFunds.length >= 3}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium transition-colors"
            >
              Add
            </button>
          </div>

          {selectedFunds.length > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-gray-700">
                  Selected Funds ({selectedFunds.length}/3)
                </p>
                {selectedFunds.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="flex gap-2 flex-wrap">
                {selectedFunds.map((fund) => (
                  <div
                    key={fund.schemeCode}
                    className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 flex items-center gap-2"
                  >
                    <span className="text-sm font-medium text-blue-900">
                      {fund.schemeName}
                    </span>
                    <button
                      onClick={() => handleRemoveFund(fund.schemeCode)}
                      className="text-blue-600 hover:text-blue-700 font-bold"
                      aria-label={`Remove ${fund.schemeName}`}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <p className="font-medium">Error loading comparison</p>
          <p className="text-sm mt-1">{error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      )}

      {isLoading ? (
        <>
          <ChartSkeleton />
          <MetricsSkeleton />
        </>
      ) : (
        data && selectedFunds.length > 0 && (
          <div className="space-y-6">
            <ComparisonTable funds={data.funds} />
            <ComparisonMetrics funds={data.funds} />
            <Disclaimer text={data.disclaimer} />
          </div>
        )
      )}
    </div>
  );
}

function ComparisonTable({
  funds
}: {
  funds: Array<{ meta: { scheme_name: string; fund_house: string; scheme_category: string; isin_growth: string } }>;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
              Property
            </th>
            {funds.map((fund, idx) => (
              <th
                key={idx}
                className="px-4 py-3 text-left text-sm font-medium text-gray-700"
              >
                Fund {idx + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          <tr>
            <td className="px-4 py-3 text-sm font-medium text-gray-700">Scheme Name</td>
            {funds.map((fund, idx) => (
              <td key={idx} className="px-4 py-3 text-sm text-gray-600">
                {fund.meta.scheme_name}
              </td>
            ))}
          </tr>
          <tr>
            <td className="px-4 py-3 text-sm font-medium text-gray-700">Fund House</td>
            {funds.map((fund, idx) => (
              <td key={idx} className="px-4 py-3 text-sm text-gray-600">
                {fund.meta.fund_house}
              </td>
            ))}
          </tr>
          <tr>
            <td className="px-4 py-3 text-sm font-medium text-gray-700">Category</td>
            {funds.map((fund, idx) => (
              <td key={idx} className="px-4 py-3 text-sm text-gray-600">
                {fund.meta.scheme_category}
              </td>
            ))}
          </tr>
          <tr>
            <td className="px-4 py-3 text-sm font-medium text-gray-700">ISIN (Growth)</td>
            {funds.map((fund, idx) => (
              <td key={idx} className="px-4 py-3 text-sm text-gray-600 font-mono">
                {fund.meta.isin_growth}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function ComparisonMetrics({
  funds
}: {
  funds: Array<{ meta: { scheme_name: string }; data: Array<{ nav: string }> }>;
}) {
  const calculateMetrics = (navData: Array<{ nav: string }>) => {
    const navValues = navData.map((d) => parseFloat(d.nav));
    const latestNAV = navValues[navValues.length - 1] || 0;
    const oldestNAV = navValues[0] || 0;
    const change = ((latestNAV - oldestNAV) / oldestNAV) * 100;

    return {
      latestNAV: latestNAV.toFixed(2),
      change: change.toFixed(2),
      dataPoints: navValues.length
    };
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {funds.map((fund, idx) => {
        const metrics = calculateMetrics(fund.data);
        return (
          <div key={idx} className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm font-medium text-gray-600 mb-3">
              Fund {idx + 1}
            </p>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Latest NAV</p>
                <p className="text-lg font-bold text-gray-900">
                  ₹{metrics.latestNAV}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Change (Period)</p>
                <p
                  className={`text-lg font-bold ${
                    parseFloat(metrics.change) >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {parseFloat(metrics.change) >= 0 ? '+' : ''}
                  {metrics.change}%
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Data Points</p>
                <p className="text-lg font-bold text-gray-900">
                  {metrics.dataPoints}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Disclaimer({ text }: { text: string }) {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <p className="text-sm text-yellow-800">{text}</p>
    </div>
  );
}
