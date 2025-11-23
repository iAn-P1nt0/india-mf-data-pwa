import { describe, expect, it } from "vitest";

import { calculateSipProjection } from "@/lib/sip";

describe("calculateSipProjection", () => {
  it("computes maturity using monthly compounding", () => {
    const result = calculateSipProjection({ monthlyContribution: 1000, durationYears: 2, expectedRate: 12 });
    expect(result.totalInvestment).toBe(24000);
    expect(result.maturityValue).toBeGreaterThan(24000);
    expect(result.gains).toBeCloseTo(result.maturityValue - result.totalInvestment, 6);
  });

  it("handles zero rate as linear growth", () => {
    const result = calculateSipProjection({ monthlyContribution: 500, durationYears: 1, expectedRate: 0 });
    expect(result.maturityValue).toBe(6000);
    expect(result.gains).toBe(0);
  });
});
