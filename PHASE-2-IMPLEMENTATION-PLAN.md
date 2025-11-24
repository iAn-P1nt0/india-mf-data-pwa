# UI/UX Enhancement Roadmap - Phase 2 Implementation Plan

**Timeline**: Q1 2026 (Jan - Mar)
**Status**: Planning Phase
**Previous Phase**: Phase 1 ✅ COMPLETE (Nov 2025)

---

## 📋 Executive Summary

Phase 2 focuses on **Advanced Visualizations** and **Enhanced Accessibility**. These features will provide power users with sophisticated data analysis tools while making the app more accessible to all users.

**Key Goals**:
- Enable data-driven decision making through rich visualizations
- Improve accessibility for screen reader users and keyboard navigators
- Optimize mobile experience with gesture support
- Maintain 90%+ test coverage across all new features

---

## 🎯 Phase 2.1 - Advanced Visualizations

### Feature 1: Category Performance Heatmap

**Purpose**: Visual comparison of fund category performance across timeframes

**Specifications**:
```
┌─────────────────────────────────────────┐
│  Category Performance Heatmap            │
├─────────────────────────────────────────┤
│           1Y Return   3Y Return   5Y CAGR │
│ ELSS         ■■■      ■■■        ■■■     │
│ Equity       ■■       ■■■        ■■      │
│ Debt         ■        ■          ■       │
│ Balanced     ■■       ■■         ■■      │
│ Liquid       ■        ■          ■       │
└─────────────────────────────────────────┘
```

**Component Structure**:
- `CategoryHeatmap.tsx` - Main component
- `useHeatmapData.ts` - Hook to aggregate category performance
- Tests: Unit tests for data aggregation, component rendering, color mapping

**Data Requirements**:
- Fund category
- Historical NAV data (1Y, 3Y, 5Y periods)
- CAGR calculation for each period

**Implementation Details**:
```tsx
interface CategoryPerformance {
  category: string;
  returns: {
    oneYear: number;
    threeYear: number;
    fiveYear: number;
  };
  fundCount: number;
  avgExpenseRatio: number;
}

interface HeatmapColor {
  value: number;
  color: string; // Red (negative) to Green (positive)
  opacity: number;
}
```

**Deliverables**:
- [ ] CategoryHeatmap component
- [ ] Color mapping utility (value → color)
- [ ] Data aggregation hook
- [ ] Unit tests (8 tests)
- [ ] E2E tests (2 scenarios)
- [ ] Documentation

---

### Feature 2: Multi-Fund Overlay Comparison Charts

**Purpose**: Compare NAV trends across multiple funds simultaneously

**Chart Types**:
1. **Normalized View** (all funds start at 100)
2. **Actual NAV View** (preserves absolute values)
3. **Percentage Change View** (shows % growth from start date)

**Component Structure**:
- `MultiComparisonChart.tsx` - Main component
- `ComparisonChartToggle.tsx` - View mode selector
- `useChartData.ts` - Data transformation hook

**Data Transformation**:
```tsx
// Normalized: Set first NAV = 100, scale others proportionally
normalized = (currentNAV / firstNAV) * 100

// Percentage: Show % change from first date
percentChange = ((currentNAV - firstNAV) / firstNAV) * 100
```

**Libraries**:
- Recharts (existing) with multiple YAxis support
- lodash for data transformation

**Implementation Details**:
```tsx
interface ComparisonDataPoint {
  date: string;
  [fundCode]: {
    nav: number;
    normalized: number;
    percentChange: number;
  };
}

interface ChartViewMode {
  mode: 'actual' | 'normalized' | 'percentChange';
  yAxisLabel: string;
}
```

**Deliverables**:
- [ ] MultiComparisonChart component
- [ ] View mode toggle UI
- [ ] Data normalization utilities
- [ ] Unit tests (10 tests)
- [ ] E2E tests (3 scenarios)
- [ ] Documentation

---

### Feature 3: Risk-Return Scatter Plot

**Purpose**: Visualize risk (volatility) vs return trade-off

**Axes**:
- X-axis: Volatility (standard deviation of returns)
- Y-axis: Return (CAGR or total return)
- Bubble size: Fund size (AUM)
- Color: Category

**Component Structure**:
- `RiskReturnScatter.tsx` - Main component
- `useScatterData.ts` - Calculate volatility and returns
- `ScatterLegend.tsx` - Category color legend

**Metrics Calculation**:
```ts
// Volatility: Standard deviation of daily/monthly returns
volatility = sqrt(variance(returns))

// Return: Compound Annual Growth Rate
CAGR = (ending / beginning) ^ (1/years) - 1

// Sharpe Ratio: (return - riskFreeRate) / volatility
sharpeRatio = (CAGR - 0.06) / volatility  // 6% = Indian risk-free rate
```

**Features**:
- Interactive tooltips showing fund details
- Click to view full fund profile
- Filter by category
- Benchmark overlay (Nifty 50, Sensex)

**Deliverables**:
- [ ] RiskReturnScatter component
- [ ] Volatility calculation utility
- [ ] Sharpe ratio calculator
- [ ] Unit tests (12 tests)
- [ ] E2E tests (4 scenarios)
- [ ] Documentation

---

### Feature 4: SIP Projection Visualization

**Purpose**: Show projected SIP growth with contributions vs returns

**Chart Components**:
1. **Stacked Area Chart**: Contributions (blue) + Growth (green)
2. **Line Chart Overlay**: Projected balance
3. **Data Table**: Year-by-year breakdown

**Features**:
- Drag to adjust SIP amount (real-time update)
- Select time period (1-30 years)
- Multiple market scenarios (pessimistic, base, optimistic)
- CAGR assumption (default: 12%)

**Component Structure**:
- `SIPProjection.tsx` - Main component
- `useProjectionCalculation.ts` - Calculation hook
- `ProjectionSettings.tsx` - Configuration panel

**Calculation Method**:
```ts
// Future Value of SIP
FV = SIP × [((1 + r)^n - 1) / r] × (1 + r)
// where r = annual return rate / 12, n = months

// Scenario-based:
pessimistic = baseCAGR * 0.8   // -20%
base = baseCAGR               // +0%
optimistic = baseCAGR * 1.2   // +20%
```

**Deliverables**:
- [ ] SIPProjection component
- [ ] Projection calculation utilities (3 scenarios)
- [ ] Drag slider for amount adjustment
- [ ] Unit tests (8 tests)
- [ ] E2E tests (3 scenarios)
- [ ] Documentation

---

### Feature 5: Historical Returns Bar Charts

**Purpose**: Compare fund returns across different timeframes

**Chart Types**:
- **Multi-timeframe bars** (1Y, 3Y, 5Y, 10Y side-by-side)
- **Category comparison** (best, worst, average fund returns)
- **Rolling returns** (e.g., 1-year returns calculated monthly)

**Component Structure**:
- `ReturnsBarChart.tsx` - Main component
- `ReturnsComparison.tsx` - Category view
- `RollingReturns.tsx` - Rolling returns view

**Features**:
- Color coding: Green (positive) / Red (negative)
- Hover tooltip with exact values
- Sort by return value
- Filter by category
- Benchmark comparison overlay

**Deliverables**:
- [ ] ReturnsBarChart component
- [ ] ReturnsComparison component
- [ ] RollingReturns component
- [ ] Unit tests (10 tests)
- [ ] E2E tests (3 scenarios)
- [ ] Documentation

---

## 📊 Data Requirements for Phase 2

All features need enhanced historical data:

```ts
interface EnhancedFundData {
  // Existing
  schemeCode: string;
  schemeName: string;

  // New required
  aum: number;                    // Assets Under Management
  expenseRatio: number;          // Annual expense ratio (%)

  // Historical returns
  returns: {
    oneMonth: number;
    threeMonth: number;
    sixMonth: number;
    oneYear: number;
    threeYear: number;
    fiveYear: number;
    tenYear?: number;
  };

  // Volatility and risk
  volatility: number;            // 1-year annualized std dev
  sharpRatio: number;            // Sharpe ratio
  beta?: number;                 // Beta vs index

  // Performance indicators
  cagr: {
    threeYear: number;
    fiveYear: number;
    tenYear?: number;
  };
}
```

**Data Source Options**:
1. **MFapi.in** - Already integrated, need to enhance
2. **AMFI** - Monthly performance data
3. **Fund house APIs** - Directly from providers
4. **Calculated fields** - Volatility, Sharpe, CAGR

---

## 🧪 Phase 2 Testing Strategy

### Unit Tests
- **Data transformation**: 40+ tests
- **Calculation utilities**: 30+ tests
- **Component rendering**: 50+ tests
- **Edge cases**: 20+ tests
- **Total**: 140+ new tests

### E2E Tests
- **Visualization interactions**: 15+ scenarios
- **Data accuracy**: 10+ verification tests
- **Performance**: 5+ load tests
- **Accessibility**: 10+ keyboard/screen reader tests

### Visual Regression Tests
- Introduce Percy/Chromatic for snapshot testing
- Capture all chart variations
- Mobile viewport comparisons

---

## 🎨 Design System for Visualizations

### Colors
- Success: `#10b981` (green)
- Warning: `#f59e0b` (amber)
- Danger: `#ef4444` (red)
- Info: `#3b82f6` (blue)
- Neutral: `#6b7280` (gray)

### Heatmap Colors
```
-30% to -10%: #ef4444 (red)
-10% to 0%:   #fca5a5 (light red)
0% to 10%:    #fef3c7 (light green)
10% to 30%:   #86efac (green)
30%+:         #22c55e (dark green)
```

### Typography
- Chart titles: 18px, bold, gray-900
- Axis labels: 12px, regular, gray-700
- Tooltips: 12px, regular, white on dark bg
- Legend: 12px, regular, gray-700

---

## 🔄 Phase 2 Implementation Sequence

### Week 1-2: Foundation
1. [ ] Set up data aggregation utilities
2. [ ] Create Recharts advanced configurations
3. [ ] Implement color mapping utilities
4. [ ] Set up mock data for all features

### Week 3-4: Feature 1-2
1. [ ] Implement CategoryHeatmap component
2. [ ] Implement MultiComparisonChart component
3. [ ] Write unit tests for both
4. [ ] Create E2E tests

### Week 5-6: Feature 3-4
1. [ ] Implement RiskReturnScatter component
2. [ ] Implement SIPProjection component
3. [ ] Write unit tests for both
4. [ ] Create E2E tests

### Week 7-8: Feature 5 + Integration
1. [ ] Implement ReturnsBarChart component
2. [ ] Implement ReturnsComparison component
3. [ ] Integrate all visualizations into dashboard
4. [ ] Performance optimization & polish

### Week 9-10: Testing & Documentation
1. [ ] Complete visual regression testing
2. [ ] Accessibility audit
3. [ ] Performance optimization
4. [ ] Write comprehensive documentation

### Week 11-12: Review & Refinement
1. [ ] Code review and refinements
2. [ ] User testing (if applicable)
3. [ ] Bug fixes
4. [ ] Final optimization

---

## 📦 Component Hierarchy

```
Dashboard
├── VisualizationsTab
│   ├── CategoryHeatmap
│   ├── MultiComparisonChart
│   │   ├── ComparisonChartToggle
│   │   └── Recharts.ComposedChart
│   ├── RiskReturnScatter
│   │   ├── ScatterLegend
│   │   └── Recharts.ScatterChart
│   ├── SIPProjection
│   │   ├── ProjectionSettings
│   │   └── Recharts.ComposedChart
│   └── ReturnsComparison
│       ├── ReturnsBarChart
│       ├── RollingReturns
│       └── Recharts.BarChart
```

---

## 🚀 Success Criteria

- [x] All 5 visualization components implemented
- [x] 140+ unit tests written and passing
- [x] 50+ E2E tests for all features
- [x] 90%+ code coverage
- [x] All charts responsive and mobile-optimized
- [x] Lighthouse score > 90
- [x] Accessibility compliance (WCAG 2.1 AA)
- [x] Performance: charts render < 500ms
- [x] Zero console errors in production

---

## 📚 Dependencies & Libraries

**New Dependencies**:
- `recharts` (existing) - Enhanced usage
- `lodash` - Data transformation utilities
- `d3-array` - Statistical calculations
- `date-fns` - Date utilities for rolling returns

**Development Dependencies**:
- `@percy/playwright` - Visual regression testing
- `@axe-core/playwright` - Accessibility testing
- `vitest` (existing) - Unit testing

---

## 🔐 Security & Compliance

- All calculations done client-side (no data sent to server)
- SEBI disclaimer on all analytical views
- No promises of returns in UI copy
- Calculations clearly labeled as "illustrative"
- Historical data marked with source and date

---

## 📝 Deliverables Summary

| Component | LOC | Tests | Documentation | Status |
|-----------|-----|-------|----------------|--------|
| CategoryHeatmap | ~200 | 8 | Yes | Planned |
| MultiComparisonChart | ~300 | 10 | Yes | Planned |
| RiskReturnScatter | ~250 | 12 | Yes | Planned |
| SIPProjection | ~280 | 8 | Yes | Planned |
| ReturnsCharts | ~350 | 10 | Yes | Planned |
| **Utilities & Hooks** | ~400 | 60 | Yes | Planned |
| **Tests (E2E)** | ~800 | 50 | Yes | Planned |
| **Documentation** | ~2000 | N/A | Yes | Planned |
| **Total** | ~3600+ | 158 | Yes | Q1 2026 |

---

## 📅 Phase 2 Timeline

- **Week 1-2**: Foundation setup
- **Week 3-6**: Features 1-4 implementation
- **Week 7-8**: Feature 5 + integration
- **Week 9-10**: Testing & documentation
- **Week 11-12**: Final refinements
- **Deployment**: End of Q1 2026

---

## 🔄 Phase 3 Preview (Accessibility & Mobile)

Once Phase 2 is complete:
- Add keyboard shortcuts (Ctrl+K for search, etc.)
- Enhance ARIA labels for screen readers
- Implement mobile gestures (swipe, pull-to-refresh)
- Optimize touch interactions
- Mobile-first responsive design

---

**Document Version**: 1.0
**Created**: November 24, 2025
**Status**: Ready for Implementation
**Next Review**: December 2025
