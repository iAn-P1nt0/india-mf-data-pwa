import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";

import type { PortfolioHolding } from "@/lib/types";
import { usePortfolioStore } from "@/hooks/usePortfolioStore";

const cacheDbMocks = vi.hoisted(() => ({
  listPortfolioHoldings: vi.fn<[], Promise<PortfolioHolding[]>>(),
  upsertPortfolioHolding: vi.fn(),
  deletePortfolioHolding: vi.fn()
}));

vi.mock("@/lib/cache-db", async () => {
  const actual = await vi.importActual<typeof import("@/lib/cache-db")>("@/lib/cache-db");
  return {
    ...actual,
    listPortfolioHoldings: cacheDbMocks.listPortfolioHoldings,
    upsertPortfolioHolding: cacheDbMocks.upsertPortfolioHolding,
    deletePortfolioHolding: cacheDbMocks.deletePortfolioHolding
  };
});

const {
  listPortfolioHoldings: listPortfolioHoldingsMock,
  upsertPortfolioHolding: upsertPortfolioHoldingMock,
  deletePortfolioHolding: deletePortfolioHoldingMock
} = cacheDbMocks;

describe("usePortfolioStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads holdings and summarizes totals", async () => {
    const holdings: PortfolioHolding[] = [
      { schemeCode: "118834", schemeName: "Flexi Cap", units: 10, avgNav: 100, notes: "", updatedAt: 0 },
      { schemeCode: "118550", schemeName: "ELSS", units: 5, avgNav: 50, notes: "Tax", updatedAt: 0 }
    ];
    listPortfolioHoldingsMock.mockResolvedValueOnce(holdings);

    const { result } = renderHook(() => usePortfolioStore());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.holdings).toEqual(holdings);
    expect(result.current.summary).toMatchObject({
      totalHoldings: 2,
      totalUnits: 15,
      totalInvested: 1250,
      averageCost: expect.any(Number)
    });
  });

  it("persists additions and refreshes holdings", async () => {
    listPortfolioHoldingsMock.mockResolvedValueOnce([]);
    listPortfolioHoldingsMock.mockResolvedValueOnce([
      { schemeCode: "120", schemeName: "After Save", units: 3, avgNav: 12, notes: "", updatedAt: 0 }
    ]);

    const { result } = renderHook(() => usePortfolioStore());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.addOrUpdate({
        schemeCode: "120",
        schemeName: "After Save",
        units: 3,
        avgNav: 12,
        notes: "",
        updatedAt: 0
      });
    });

    expect(upsertPortfolioHoldingMock).toHaveBeenCalledWith(
      expect.objectContaining({ schemeCode: "120", schemeName: "After Save" })
    );
    expect(listPortfolioHoldingsMock).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(result.current.holdings).toHaveLength(1));
  });

  it("removes holdings and surfaces errors", async () => {
    listPortfolioHoldingsMock.mockResolvedValueOnce([
      { schemeCode: "321", schemeName: "Remove", units: 1, avgNav: 10, notes: "", updatedAt: 0 }
    ]);
    listPortfolioHoldingsMock.mockRejectedValueOnce(new Error("Unable to load holdings"));

    const { result } = renderHook(() => usePortfolioStore());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.remove("321");
    });

    expect(deletePortfolioHoldingMock).toHaveBeenCalledWith("321");
    await waitFor(() => expect(result.current.error).toBeDefined());
  });
});
