import type { SipInput, SipProjection } from "@/lib/types";

export function calculateSipProjection(payload: SipInput): SipProjection {
  const monthlyRate = payload.expectedRate / 12 / 100;
  const months = payload.durationYears * 12;
  if (monthlyRate === 0) {
    const maturityValue = payload.monthlyContribution * months;
    return {
      totalInvestment: payload.monthlyContribution * months,
      maturityValue,
      gains: 0
    };
  }
  const growthFactor = Math.pow(1 + monthlyRate, months);
  const maturityValue = payload.monthlyContribution * ((growthFactor - 1) / monthlyRate) * (1 + monthlyRate);
  const totalInvestment = payload.monthlyContribution * months;
  return {
    totalInvestment,
    maturityValue,
    gains: maturityValue - totalInvestment
  };
}
