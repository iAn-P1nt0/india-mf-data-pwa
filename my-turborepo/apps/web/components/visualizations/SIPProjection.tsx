'use client';

/**
 * SIP Projection Visualization Component
 * Shows projected growth of Systematic Investment Plan (SIP) over time
 * Breaks down contributions vs returns
 */

import React, { useMemo, useState } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface SIPProjectionProps {
  monthlyAmount?: number;
  annualReturn?: number;
  years?: number;
  fundName?: string;
  onParametersChange?: (amount: number, annualReturn: number, yearsCount: number) => void;
}

interface SIPData {
  month: number;
  contributions: number;
  gains: number;
  totalValue: number;
  year: number;
}

const calculateSIPProjection = (
  monthlyAmount: number,
  annualReturn: number,
  years: number
): SIPData[] => {
  const monthlyReturn = annualReturn / 12 / 100;
  const totalMonths = years * 12;
  const data: SIPData[] = [];

  let totalValue = 0;
  let totalContributions = 0;

  for (let month = 1; month <= totalMonths; month++) {
    // Apply monthly return to existing value
    totalValue = totalValue * (1 + monthlyReturn) + monthlyAmount;
    totalContributions = month * monthlyAmount;
    const gains = Math.max(0, totalValue - totalContributions);

    data.push({
      month,
      contributions: Math.round(totalContributions),
      gains: Math.round(gains),
      totalValue: Math.round(totalValue),
      year: Math.ceil(month / 12)
    });
  }

  // Return annual snapshots
  return data.filter(d => d.month % 12 === 0 || d.month === totalMonths);
};

export default function SIPProjection({
  monthlyAmount = 5000,
  annualReturn = 12,
  years = 10,
  fundName = 'Selected Fund',
  onParametersChange
}: SIPProjectionProps) {
  const [amount, setAmount] = useState(monthlyAmount);
  const [returnRate, setReturnRate] = useState(annualReturn);
  const [period, setPeriod] = useState(years);

  // Calculate projection
  const projectionData = useMemo(
    () => calculateSIPProjection(amount, returnRate, period),
    [amount, returnRate, period]
  );

  // Calculate summary
  const summary = useMemo(() => {
    const lastData = projectionData[projectionData.length - 1];
    if (!lastData) return { totalInvested: 0, totalValue: 0, gains: 0, xirr: 0 };

    return {
      totalInvested: lastData.contributions,
      totalValue: lastData.totalValue,
      gains: lastData.gains,
      xirr: ((lastData.totalValue / lastData.contributions) ** (1 / period) - 1) * 100
    };
  }, [projectionData, period]);

  const handleApply = () => {
    onParametersChange?.(amount, returnRate, period);
  };

  return (
    <div className="space-y-6">
      {/* Input Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-6">SIP Projection Calculator</h3>

        <div className="grid grid-cols-3 gap-6">
          {/* Monthly Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monthly Investment Amount
            </label>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">₹</span>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(Math.max(100, Number(e.target.value)))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="100"
                step="500"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Min: ₹100</p>
          </div>

          {/* Annual Return */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expected Annual Return
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={returnRate}
                onChange={e => setReturnRate(Math.max(0, Number(e.target.value)))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                max="100"
                step="0.5"
              />
              <span className="text-gray-600">%</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Historical avg: 12-15%</p>
          </div>

          {/* Investment Period */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Investment Period
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={period}
                onChange={e => setPeriod(Math.max(1, Number(e.target.value)))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
                max="50"
              />
              <span className="text-gray-600">years</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Recommended: 5-20 years</p>
          </div>
        </div>

        <button
          onClick={handleApply}
          className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
        >
          Calculate Projection
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-600 mb-1">Total Invested</p>
          <p className="text-2xl font-bold text-gray-900">₹{(summary.totalInvested / 100000).toFixed(2)}L</p>
          <p className="text-xs text-gray-500 mt-2">{period} years</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-600 mb-1">Projected Value</p>
          <p className="text-2xl font-bold text-green-600">₹{(summary.totalValue / 100000).toFixed(2)}L</p>
          <p className="text-xs text-gray-500 mt-2">at {returnRate}% CAGR</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-600 mb-1">Total Gains</p>
          <p className="text-2xl font-bold text-blue-600">₹{(summary.gains / 100000).toFixed(2)}L</p>
          <p className="text-xs text-gray-500 mt-2">
            {summary.totalInvested > 0
              ? ((summary.gains / summary.totalInvested) * 100).toFixed(0)
              : 0}
            % return
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-600 mb-1">XIRR</p>
          <p className="text-2xl font-bold text-purple-600">{summary.xirr.toFixed(2)}%</p>
          <p className="text-xs text-gray-500 mt-2">Annualized return</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">SIP Growth Projection</h3>

        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={projectionData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="year"
              label={{ value: 'Years', position: 'insideBottomRight', offset: -5 }}
            />
            <YAxis
              label={{ value: 'Amount (₹)', angle: -90, position: 'insideLeft' }}
              tickFormatter={val => `₹${(val / 100000).toFixed(0)}L`}
            />
            <Tooltip
              formatter={(value: number) => `₹${(value / 100000).toFixed(2)}L`}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as SIPData;
                  return (
                    <div className="bg-white border border-gray-300 rounded-lg p-3 shadow-lg">
                      <p className="font-semibold text-sm">Year {data.year}</p>
                      <p className="text-sm">
                        <span className="font-medium">Invested:</span> ₹{(data.contributions / 100000).toFixed(2)}L
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Gains:</span> ₹{(data.gains / 100000).toFixed(2)}L
                      </p>
                      <p className="text-sm font-bold">
                        <span className="font-medium">Total:</span> ₹{(data.totalValue / 100000).toFixed(2)}L
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Bar dataKey="contributions" stackId="a" fill="#3b82f6" name="Contributions" />
            <Bar dataKey="gains" stackId="a" fill="#10b981" name="Gains" />
            <Line
              type="monotone"
              dataKey="totalValue"
              stroke="#8b5cf6"
              strokeWidth={3}
              name="Total Value"
              yAxisId="right"
            />
          </ComposedChart>
        </ResponsiveContainer>

        <YAxis
          yAxisId="right"
          orientation="right"
          label={{ value: 'Total Value', angle: 90, position: 'insideRight' }}
          tickFormatter={val => `₹${(val / 100000).toFixed(0)}L`}
        />
      </div>

      {/* Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-gray-700">
          <strong>💡 How SIP Works:</strong> You invest a fixed amount every month. The invested amount earns
          returns, which are reinvested. Over time, you benefit from compounding. XIRR is your annualized return
          rate accounting for the timing of investments.
        </p>
      </div>

      {/* SEBI Disclaimer */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-xs text-gray-700">
          <strong>⚠️ Disclaimer:</strong> This projection is based on assumed returns and does not guarantee actual
          results. Past performance is not indicative of future returns. Mutual fund investments are subject to
          market risks. Consult a financial advisor before investing.
        </p>
      </div>
    </div>
  );
}
