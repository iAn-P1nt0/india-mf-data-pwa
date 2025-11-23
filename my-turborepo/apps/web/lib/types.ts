export type FundPreview = {
  schemeCode: string;
  schemeName: string;
  fundHouse?: string | null;
  schemeCategory?: string | null;
  schemeType?: string | null;
};

export type FundsResponse = {
  success: boolean;
  funds?: FundPreview[];
  disclaimer?: string;
  fetchedAt?: string;
  source?: string;
  error?: string;
};

export type NavPoint = {
  date: string;
  nav: string | number;
};

export type NavHistoryResponse = {
  success: boolean;
  navHistory: {
    meta: {
      scheme_code: string;
      scheme_name: string;
    };
    data: NavPoint[];
    status: string;
  };
  disclaimer?: string;
  fetchedAt?: string;
  source?: string;
};

export type SipInput = {
  monthlyContribution: number;
  durationYears: number;
  expectedRate: number;
};

export type SipProjection = {
  totalInvestment: number;
  maturityValue: number;
  gains: number;
};

export type PortfolioHolding = {
  id?: number;
  schemeCode: string;
  schemeName: string;
  units: number;
  avgNav: number;
  notes?: string;
  updatedAt: number;
  createdAt: number;
};

export type PortfolioSummary = {
  totalHoldings: number;
  totalUnits: number;
  totalInvested: number;
  averageCost: number;
};
