'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '@/lib/db';

export interface WatchlistItem {
  id?: number;
  schemeCode: string;
  schemeName: string;
  fundHouse: string;
  schemeCategory: string;
  addedAt: Date;
}

interface WatchlistContextType {
  watchlist: WatchlistItem[];
  addToWatchlist: (item: Omit<WatchlistItem, 'id' | 'addedAt'>) => Promise<void>;
  removeFromWatchlist: (schemeCode: string) => Promise<void>;
  isInWatchlist: (schemeCode: string) => boolean;
  clearWatchlist: () => Promise<void>;
  loading: boolean;
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

export function WatchlistProvider({ children }: { children: React.ReactNode }) {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load watchlist from IndexedDB on mount
  useEffect(() => {
    const loadWatchlist = async () => {
      try {
        const items = await db.watchlist.toArray();
        setWatchlist(items);
      } catch (error) {
        console.error('Failed to load watchlist:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWatchlist();
  }, []);

  const addToWatchlist = async (item: Omit<WatchlistItem, 'id' | 'addedAt'>) => {
    const newItem: WatchlistItem = {
      ...item,
      addedAt: new Date()
    };

    try {
      const id = await db.watchlist.add(newItem);
      setWatchlist((prev) => [...prev, { ...newItem, id }]);
    } catch (error) {
      console.error('Failed to add to watchlist:', error);
      throw error;
    }
  };

  const removeFromWatchlist = async (schemeCode: string) => {
    try {
      const item = watchlist.find((w) => w.schemeCode === schemeCode);
      if (item?.id) {
        await db.watchlist.delete(item.id);
      }
      setWatchlist((prev) => prev.filter((w) => w.schemeCode !== schemeCode));
    } catch (error) {
      console.error('Failed to remove from watchlist:', error);
      throw error;
    }
  };

  const isInWatchlist = (schemeCode: string) => {
    return watchlist.some((w) => w.schemeCode === schemeCode);
  };

  const clearWatchlist = async () => {
    try {
      await db.watchlist.clear();
      setWatchlist([]);
    } catch (error) {
      console.error('Failed to clear watchlist:', error);
      throw error;
    }
  };

  return (
    <WatchlistContext.Provider
      value={{ watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist, clearWatchlist, loading }}
    >
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
}
