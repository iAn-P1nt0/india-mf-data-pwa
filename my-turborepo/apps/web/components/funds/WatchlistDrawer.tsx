'use client';

import React, { useState } from 'react';
import { useWatchlist } from '@/app/contexts/WatchlistContext';
import { useToast } from '@/app/contexts/ToastContext';

interface WatchlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WatchlistDrawer({ isOpen, onClose }: WatchlistDrawerProps) {
  const { watchlist, removeFromWatchlist, clearWatchlist, loading } = useWatchlist();
  const { addToast } = useToast();
  const [isClearing, setIsClearing] = useState(false);

  const handleRemove = async (schemeCode: string, schemeName: string) => {
    try {
      await removeFromWatchlist(schemeCode);
      addToast(`${schemeName} removed from watchlist`, 'info');
    } catch (error) {
      addToast('Failed to remove from watchlist', 'error');
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear all watchlisted funds?')) {
      return;
    }

    setIsClearing(true);
    try {
      await clearWatchlist();
      addToast('Watchlist cleared', 'success');
    } catch (error) {
      addToast('Failed to clear watchlist', 'error');
    } finally {
      setIsClearing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        role="presentation"
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-lg flex flex-col">
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Watchlist</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            aria-label="Close watchlist"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading...</div>
          ) : watchlist.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <p className="text-lg font-medium mb-2">No funds in watchlist</p>
              <p className="text-sm">
                Add funds by clicking the star icon on any fund
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {watchlist.map((item) => (
                <div
                  key={item.schemeCode}
                  className="p-4 border-b last:border-b-0 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 mb-1">
                        {item.schemeName}
                      </p>
                      <p className="text-sm text-gray-600">{item.fundHouse}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.schemeCategory}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        handleRemove(item.schemeCode, item.schemeName)
                      }
                      className="text-yellow-600 hover:text-yellow-700 ml-2 text-xl"
                      aria-label={`Remove ${item.schemeName}`}
                    >
                      ★
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Added {new Date(item.addedAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {watchlist.length > 0 && (
          <div className="border-t px-6 py-4 bg-gray-50">
            <button
              onClick={handleClearAll}
              disabled={isClearing}
              className="w-full px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Clear All
            </button>
          </div>
        )}
      </div>
    </>
  );
}
