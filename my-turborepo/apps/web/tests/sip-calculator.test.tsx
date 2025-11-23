import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SipCalculator } from "@/components/sip/SipCalculator";

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient();
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("SipCalculator", () => {
  let fetchMock: vi.Mock;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          projection: { totalInvestment: 60000, maturityValue: 75000, gains: 15000 },
          source: "unit-test"
        })
      )
    );
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("prefers API response when available", async () => {
    renderWithClient(<SipCalculator />);

    fireEvent.submit(screen.getByRole("button", { name: /calculate/i }).closest("form")!);

    expect(await screen.findByTestId("total")).toHaveTextContent("₹60,000");
    expect(screen.getByTestId("maturity")).toHaveTextContent("75000");
    expect(screen.getByTestId("gains")).toHaveTextContent("15000");
    expect(screen.getByText(/unit-test/)).toBeInTheDocument();
  });

  it("falls back to client math when API fails", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network"));
    renderWithClient(<SipCalculator />);
    const contribution = screen.getByLabelText(/monthly contribution/i);
    await userEvent.clear(contribution);
    await userEvent.type(contribution, "1000");

    const duration = screen.getByLabelText(/duration/i);
    await userEvent.clear(duration);
    await userEvent.type(duration, "1");

    const rate = screen.getByLabelText(/expected annual return/i);
    await userEvent.clear(rate);
    await userEvent.type(rate, "12");

    fireEvent.submit(screen.getByRole("button", { name: /calculate/i }).closest("form")!);

    expect(await screen.findByTestId("total")).toHaveTextContent("₹12,000");
    expect(screen.getByText(/client-fallback/)).toBeInTheDocument();
  });
});
