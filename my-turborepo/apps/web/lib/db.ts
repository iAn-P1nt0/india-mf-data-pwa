import Dexie, { Table } from 'dexie';
import { FundRecord, NavRecord, MetaRecord } from './cache-db';

export interface WatchlistItem {
  id?: number;
  schemeCode: string;
  schemeName: string;
  fundHouse: string;
  schemeCategory: string;
  addedAt: Date;
}

export interface PortfolioHolding {
  id?: number;
  schemeCode: string;
  schemeName: string;
  fundHouse: string;
  units: number;
  avgNav: number;
  createdAt?: number;
  updatedAt?: number;
}

class FundDatabase extends Dexie {
  funds!: Table<FundRecord, string>;
  navHistory!: Table<NavRecord>;
  meta!: Table<MetaRecord, string>;
  portfolio!: Table<PortfolioHolding>;
  watchlist!: Table<WatchlistItem>;
}

let dbInstance: FundDatabase | null = null;

function createDatabase() {
  const db = new FundDatabase('india-mf-data-cache');
  db.version(3).stores({
    funds: '&schemeCode, schemeName',
    navHistory: '++id, schemeCode, navDate, [schemeCode+navDate]',
    meta: '&key',
    portfolio: '++id,&schemeCode,schemeName',
    watchlist: '++id,&schemeCode,addedAt'
  });
  return db;
}

export function getDb() {
  if (typeof window === 'undefined') {
    return null;
  }
  if (!dbInstance) {
    dbInstance = createDatabase();
  }
  return dbInstance;
}

export async function resetDb() {
  if (dbInstance) {
    await dbInstance.delete();
    dbInstance = null;
  }
}

// Export as 'db' for backward compatibility
export { getDb as default };

// Re-export for convenience
export const db = {
  get instance() {
    return getDb();
  },
  get watchlist() {
    const instance = getDb();
    if (!instance) throw new Error('Database not available');
    return instance.watchlist;
  },
  get portfolio() {
    const instance = getDb();
    if (!instance) throw new Error('Database not available');
    return instance.portfolio;
  },
  get funds() {
    const instance = getDb();
    if (!instance) throw new Error('Database not available');
    return instance.funds;
  },
  get navHistory() {
    const instance = getDb();
    if (!instance) throw new Error('Database not available');
    return instance.navHistory;
  },
  get meta() {
    const instance = getDb();
    if (!instance) throw new Error('Database not available');
    return instance.meta;
  }
};
