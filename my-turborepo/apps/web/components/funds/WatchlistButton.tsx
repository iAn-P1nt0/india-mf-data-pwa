'use client';

import React, { useCallback, useState } from 'react';
import { useWatchlist } from '@/app/contexts/WatchlistContext';
import { useToast } from '@/app/contexts/ToastContext';

interface WatchlistButtonProps {
  schemeCode: string;
  schemeName: string;
  fundHouse: string;
  schemeCategory: string;
  className?: string;
}

export default function WatchlistButton({
  schemeCode,
  schemeName,
  fundHouse,
  schemeCategory,
  className = ''
}: WatchlistButtonProps) {
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const inWatchlist = isInWatchlist(schemeCode);

  const handleToggle = useCallback(async () => {
    setIsLoading(true);
    try {
      if (inWatchlist) {
        await removeFromWatchlist(schemeCode);
        addToast(`${schemeName} removed from watchlist`, 'info');
      } else {
        await addToWatchlist({
          schemeCode,
          schemeName,
          fundHouse,
          schemeCategory
        });
        addToast(`${schemeName} added to watchlist`, 'success');
      }
    } catch (error) {
      addToast(
        `Failed to ${inWatchlist ? 'remove from' : 'add to'} watchlist`,
        'error'
      );
      console.error('Watchlist error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [
    inWatchlist,
    schemeCode,
    schemeName,
    fundHouse,
    schemeCategory,
    removeFromWatchlist,
    addToWatchlist,
    addToast
  ]);

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`
        px-4 py-2 rounded-lg font-medium transition-all duration-200
        ${
          inWatchlist
            ? 'bg-yellow-100 text-yellow-900 hover:bg-yellow-200 border border-yellow-300'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      aria-label={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
    >
      <span className="inline-block mr-2">{inWatchlist ? '★' : '☆'}</span>
      {inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
    </button>
  );
}
