import Dexie, { Table } from "dexie";

import type {
  FundPreview,
  FundsResponse,
  NavPoint,
  PortfolioHolding,
  PortfolioSummary
} from "@/lib/types";

export type FundRecord = FundPreview & { cachedAt: number };
export type NavRecord = {
  id?: number;
  schemeCode: string;
  navDate: string;
  navValue: number;
  cachedAt: number;
};
export type MetaRecord = {
  key: string;
  value: Record<string, unknown> | undefined;
  updatedAt: number;
};

class FundsCacheDatabase extends Dexie {
  funds!: Table<FundRecord, string>;
  navHistory!: Table<NavRecord>;
  meta!: Table<MetaRecord, string>;
  portfolio!: Table<PortfolioHolding>;
}

let dbInstance: FundsCacheDatabase | null = null;

function createDatabase() {
  const db = new FundsCacheDatabase("india-mf-data-cache");
  db.version(2).stores({
    funds: "&schemeCode, schemeName",
    navHistory: "++id, schemeCode, navDate, [schemeCode+navDate]",
    meta: "&key",
    portfolio: "++id,&schemeCode,schemeName"
  });
  return db;
}

export function getCacheDb() {
  if (typeof window === "undefined") {
    return null;
  }
  if (!dbInstance) {
    dbInstance = createDatabase();
  }
  return dbInstance;
}

export async function resetCacheDb() {
  if (dbInstance) {
    await dbInstance.delete();
    dbInstance = null;
  }
}

export async function storeFundsSnapshot(snapshot: FundsResponse) {
  const db = getCacheDb();
  if (!db || !snapshot.funds?.length) {
    return;
  }
  const now = Date.now();
  await db.transaction("rw", db.funds, db.meta, async () => {
    await db.funds.clear();
    await db.funds.bulkPut(snapshot.funds.map((fund) => ({ ...fund, cachedAt: now })));
    await db.meta.put({
      key: "funds",
      value: {
        disclaimer: snapshot.disclaimer,
        fetchedAt: snapshot.fetchedAt,
        source: snapshot.source
      },
      updatedAt: now
    });
  });
}

export async function readFundsSnapshot(limit?: number) {
  const db = getCacheDb();
  if (!db) {
    return { funds: [], meta: undefined };
  }
  const [funds, meta] = await Promise.all([
    db.funds.orderBy("schemeName").toArray(),
    db.meta.get("funds")
  ]);
  const sliced = typeof limit === "number" ? funds.slice(0, limit) : funds;
  return { funds: sliced, meta: meta?.value };
}

export async function storeNavHistory(schemeCode: string, points: NavPoint[]) {
  const db = getCacheDb();
  if (!db || !points.length) {
    return;
  }
  const now = Date.now();
  await db.transaction("rw", db.navHistory, async () => {
    await db.navHistory.bulkPut(
      points.map((point) => ({
        schemeCode,
        navDate: toIso(point.date),
        navValue: typeof point.nav === "string" ? Number(point.nav) : point.nav,
        cachedAt: now
      }))
    );
  });
}

export async function readNavHistory(
  schemeCode: string,
  startDate?: string,
  endDate?: string
) {
  const db = getCacheDb();
  if (!db) {
    return [] as NavRecord[];
  }
  const all = await db.navHistory.where({ schemeCode }).toArray();
  const start = startDate ? new Date(startDate).getTime() : undefined;
  const end = endDate ? new Date(endDate).getTime() : undefined;
  return all.filter((row) => {
    const ts = new Date(row.navDate).getTime();
    if (Number.isNaN(ts)) {
      return false;
    }
    if (typeof start === "number" && ts < start) {
      return false;
    }
    if (typeof end === "number" && ts > end) {
      return false;
    }
    return true;
  });
}

export async function listPortfolioHoldings() {
  const db = getCacheDb();
  if (!db) {
    return [] as PortfolioHolding[];
  }
  return db.portfolio.orderBy("schemeName").toArray();
}

type HoldingInput = Omit<PortfolioHolding, "id" | "createdAt" | "updatedAt">;

export async function upsertPortfolioHolding(input: HoldingInput) {
  const db = getCacheDb();
  if (!db) {
    return undefined;
  }
  const now = Date.now();
  const existing = await db.portfolio.where("schemeCode").equals(input.schemeCode).first();
  if (existing?.id) {
    await db.portfolio.update(existing.id, {
      ...existing,
      ...input,
      updatedAt: now
    });
    return existing.id;
  }
  return db.portfolio.put({
    ...input,
    createdAt: now,
    updatedAt: now
  });
}

export async function deletePortfolioHolding(schemeCode: string) {
  const db = getCacheDb();
  if (!db) {
    return 0;
  }
  return db.portfolio.where("schemeCode").equals(schemeCode).delete();
}

export function summarizeHoldings(holdings: PortfolioHolding[]): PortfolioSummary {
  if (!holdings.length) {
    return { totalHoldings: 0, totalUnits: 0, totalInvested: 0, averageCost: 0 };
  }
  const totalUnits = holdings.reduce((acc, holding) => acc + holding.units, 0);
  const totalInvested = holdings.reduce((acc, holding) => acc + holding.units * holding.avgNav, 0);
  return {
    totalHoldings: holdings.length,
    totalUnits,
    totalInvested,
    averageCost: totalUnits ? totalInvested / totalUnits : 0
  };
}

function toIso(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return `${value}T00:00:00.000Z`;
  }
  const parts = value.split("-");
  if (parts.length === 3) {
    const [day, month, year] = parts;
    const iso = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T00:00:00.000Z`;
    return iso;
  }
  return new Date(value).toISOString();
}
