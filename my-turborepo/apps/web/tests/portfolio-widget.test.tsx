import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PortfolioWidget } from "@/components/portfolio/PortfolioWidget";
import { usePortfolioStore } from "@/hooks/usePortfolioStore";

vi.mock("@/hooks/usePortfolioStore", () => ({
  usePortfolioStore: vi.fn()
}));

const mockUsePortfolioStore = usePortfolioStore as unknown as vi.MockedFunction<typeof usePortfolioStore>;

const baseStore = () => ({
  holdings: [],
  summary: { totalHoldings: 0, totalUnits: 0, totalInvested: 0, averageCost: 0 },
  addOrUpdate: vi.fn(),
  remove: vi.fn(),
  loading: false,
  error: undefined,
  refresh: vi.fn()
});

describe("PortfolioWidget", () => {
  beforeEach(() => {
    mockUsePortfolioStore.mockReset();
  });

  it("renders summary stats and holdings list", async () => {
    const remove = vi.fn();
    const storeState = {
      ...baseStore(),
      holdings: [
        { schemeCode: "118834", schemeName: "Flexi Cap", units: 10, avgNav: 100, notes: "", updatedAt: 0 }
      ],
      summary: { totalHoldings: 1, totalUnits: 10, totalInvested: 1000, averageCost: 100 },
      remove
    };
    mockUsePortfolioStore.mockReturnValue(storeState);

    const user = userEvent.setup();
    render(<PortfolioWidget />);

    expect(screen.getByTestId("total-holdings")).toHaveTextContent("1");
    expect(screen.getByTestId("total-invested")).toHaveTextContent("1000.00");
    expect(screen.getByText("Flexi Cap")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(remove).toHaveBeenCalledWith("118834");
  });

  it("validates and submits holdings", async () => {
    const addOrUpdate = vi.fn().mockResolvedValue(undefined);
    mockUsePortfolioStore.mockReturnValue({
      ...baseStore(),
      addOrUpdate
    });

    const user = userEvent.setup();
    render(<PortfolioWidget />);

    await user.type(screen.getByLabelText("Scheme code"), "123456");
    await user.type(screen.getByLabelText("Scheme name"), "Test Fund");
    const unitsInput = screen.getByLabelText("Units held");
    await user.clear(unitsInput);
    await user.type(unitsInput, "12.5");
    const avgNavInput = screen.getByLabelText("Avg NAV (₹)");
    await user.clear(avgNavInput);
    await user.type(avgNavInput, "45.5");
    await user.type(screen.getByLabelText("Notes"), "Long term");

    await user.click(screen.getByRole("button", { name: "Save holding" }));

    expect(addOrUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        schemeCode: "123456",
        schemeName: "Test Fund",
        units: 12.5,
        avgNav: 45.5,
        notes: "Long term"
      })
    );
    expect(screen.getByLabelText("Scheme code")).toHaveValue("");
  });
});
