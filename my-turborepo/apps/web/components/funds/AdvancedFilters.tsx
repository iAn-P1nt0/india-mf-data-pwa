'use client';

import React, { useState, useCallback } from 'react';
import { useToast } from '@/app/contexts/ToastContext';

export interface FilterOptions {
  categories: string[];
  minAUM?: number;
  maxAUM?: number;
  minExpenseRatio?: number;
  maxExpenseRatio?: number;
}

interface AdvancedFiltersProps {
  onFiltersChange: (filters: FilterOptions) => void;
  availableCategories: string[];
  isOpen: boolean;
  onToggle: () => void;
}

export default function AdvancedFilters({
  onFiltersChange,
  availableCategories,
  isOpen,
  onToggle
}: AdvancedFiltersProps) {
  const { addToast } = useToast();
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set()
  );
  const [minAUM, setMinAUM] = useState('');
  const [maxAUM, setMaxAUM] = useState('');
  const [minExpenseRatio, setMinExpenseRatio] = useState('');
  const [maxExpenseRatio, setMaxExpenseRatio] = useState('');

  const handleCategoryToggle = useCallback((category: string) => {
    setSelectedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  }, []);

  const handleApplyFilters = useCallback(() => {
    // Validate AUM values
    const minAUMNum = minAUM ? Number(minAUM) : undefined;
    const maxAUMNum = maxAUM ? Number(maxAUM) : undefined;

    if (minAUMNum !== undefined && maxAUMNum !== undefined && minAUMNum > maxAUMNum) {
      addToast('Minimum AUM must be less than maximum AUM', 'error');
      return;
    }

    // Validate Expense Ratio values
    const minERNum = minExpenseRatio ? Number(minExpenseRatio) : undefined;
    const maxERNum = maxExpenseRatio ? Number(maxExpenseRatio) : undefined;

    if (minERNum !== undefined && maxERNum !== undefined && minERNum > maxERNum) {
      addToast('Minimum expense ratio must be less than maximum', 'error');
      return;
    }

    const filters: FilterOptions = {
      categories: Array.from(selectedCategories),
      minAUM: minAUMNum,
      maxAUM: maxAUMNum,
      minExpenseRatio: minERNum,
      maxExpenseRatio: maxERNum
    };

    onFiltersChange(filters);
    addToast('Filters applied', 'success');
  }, [
    selectedCategories,
    minAUM,
    maxAUM,
    minExpenseRatio,
    maxExpenseRatio,
    onFiltersChange,
    addToast
  ]);

  const handleClearFilters = useCallback(() => {
    setSelectedCategories(new Set());
    setMinAUM('');
    setMaxAUM('');
    setMinExpenseRatio('');
    setMaxExpenseRatio('');
    onFiltersChange({
      categories: []
    });
    addToast('Filters cleared', 'info');
  }, [onFiltersChange, addToast]);

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium transition-colors"
      >
        ⚙️ Advanced Filters
      </button>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Advanced Filters</h3>
        <button
          onClick={onToggle}
          className="text-gray-500 hover:text-gray-700 text-2xl"
        >
          ✕
        </button>
      </div>

      {/* Categories */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Categories
        </label>
        <div className="grid grid-cols-2 gap-3">
          {availableCategories.map((category) => (
            <label
              key={category}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedCategories.has(category)}
                onChange={() => handleCategoryToggle(category)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">{category}</span>
            </label>
          ))}
        </div>
      </div>

      {/* AUM Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          AUM Range (₹ Cr)
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <input
              type="number"
              placeholder="Min AUM"
              value={minAUM}
              onChange={(e) => setMinAUM(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
            />
          </div>
          <div>
            <input
              type="number"
              placeholder="Max AUM"
              value={maxAUM}
              onChange={(e) => setMaxAUM(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
            />
          </div>
        </div>
      </div>

      {/* Expense Ratio */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Expense Ratio (%)
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <input
              type="number"
              placeholder="Min ER"
              value={minExpenseRatio}
              onChange={(e) => setMinExpenseRatio(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <input
              type="number"
              placeholder="Max ER"
              value={maxExpenseRatio}
              onChange={(e) => setMaxExpenseRatio(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
              step="0.01"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4 pt-4">
        <button
          onClick={handleClearFilters}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
        >
          Clear
        </button>
        <button
          onClick={handleApplyFilters}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}
