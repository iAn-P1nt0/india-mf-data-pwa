'use client';

/**
 * Comparison Chart Toggle Component
 * Toggles between different chart types and view modes
 */

import React from 'react';

export interface ComparisonChartToggleProps {
  currentMode: 'absolute' | 'normalized' | 'percentage';
  onModeChange: (mode: 'absolute' | 'normalized' | 'percentage') => void;
  showLabels?: boolean;
}

export default function ComparisonChartToggle({
  currentMode,
  onModeChange,
  showLabels = true
}: ComparisonChartToggleProps) {
  const modes = [
    {
      id: 'absolute',
      label: 'Absolute',
      description: 'NAV in rupees',
      icon: '₹'
    },
    {
      id: 'normalized',
      label: 'Normalized',
      description: 'Start at 100',
      icon: '📊'
    },
    {
      id: 'percentage',
      label: '% Change',
      description: 'Growth %',
      icon: '%'
    }
  ] as const;

  return (
    <div className="flex gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <span className="text-sm font-semibold text-gray-700 self-center">Chart Mode:</span>
      <div className="flex gap-1">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => onModeChange(mode.id as any)}
            className={`px-3 py-2 rounded transition-colors ${
              currentMode === mode.id
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
            }`}
            aria-label={`${mode.label}: ${mode.description}`}
            aria-pressed={currentMode === mode.id}
            title={mode.description}
          >
            <span className="mr-1">{mode.icon}</span>
            {showLabels && <span className="text-sm font-medium">{mode.label}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
