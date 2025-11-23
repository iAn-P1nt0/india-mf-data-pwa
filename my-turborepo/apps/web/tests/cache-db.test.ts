import { describe, it, expect, beforeEach } from "vitest";

import { readFundsSnapshot, readNavHistory, resetCacheDb, storeFundsSnapshot, storeNavHistory } from "@/lib/cache-db";

describe("cache-db", () => {
  beforeEach(async () => {
    await resetCacheDb();
  });

  it("persists fund snapshots and respects limit", async () => {
    await storeFundsSnapshot({
      success: true,
      funds: [
        { schemeCode: "1", schemeName: "Alpha Fund" },
        { schemeCode: "2", schemeName: "Beta Fund" }
      ],
      disclaimer: "Test disclaimer",
      fetchedAt: "2025-11-23T00:00:00Z",
      source: "test-suite"
    });

    const snapshot = await readFundsSnapshot(1);
    expect(snapshot.funds).toHaveLength(1);
    expect(snapshot.funds[0].schemeName).toBe("Alpha Fund");
    expect(snapshot.meta).toMatchObject({ disclaimer: "Test disclaimer", source: "test-suite" });
  });

  it("stores NAV history rows in ISO format", async () => {
    await storeNavHistory("123", [
      { date: "22-11-2025", nav: "12.34" },
      { date: "2025-11-23", nav: 12.5 }
    ]);

    const rows = await readNavHistory("123", "2025-11-21", "2025-11-24");
    expect(rows).toHaveLength(2);
    expect(rows[0].navValue).toBeCloseTo(12.34, 2);
    expect(rows[1].navDate).toContain("2025-11-23");
  });
});
