# India Mutual Funds Data PWA

Open-source, SEBI-compliant mutual fund analytics stack with an offline-capable Next.js frontend and Express/Prisma API. See `CLAUDE.md` for the full product brief and `AGENTS.md` for operating guardrails.

## Getting Started

```bash
git clone https://github.com/iAn-P1nt0/mf-data-pwa.git
cd mf-data-pwa/my-turborepo
npm install
npm run dev
```

Key docs:

- `Quick-Start-Guide.md` – 4-hour build instructions. Now references `DEPLOYMENT.md` once you are ready to ship.
- `DEPLOYMENT.md` – Detailed PWA frontend deployment architecture (Vercel topology, CI gates, rollback plan).
- `Technical-FAQ-Decisions.md` – Decision log and compliance FAQ.
- `TESTING.md` – Authoritative automation matrix.

The backend (Render) and frontend (Vercel) are deployed separately; configure `NEXT_PUBLIC_API_BASE_URL` to point at your API URL before building the web workspace.

---

## UI/UX Enhancement Roadmap

This PWA is continuously evolving to match best-in-class mutual fund analytics platforms while maintaining SEBI compliance and offline-first architecture.

### Current Features (✅ Completed)
- **Fund Discovery**: Browse and search 100+ mutual funds with real-time data
- **NAV Analytics**: Interactive charts with historical NAV trends and performance metrics
- **Portfolio Tracker**: Client-side holdings management with IndexedDB persistence
- **SIP Calculator**: Goal-based SIP projections with backend formula parity
- **Performance Metrics**: CAGR, volatility, absolute returns with date range filtering
- **Offline Support**: Service worker + cache-first strategy for resilient UX
- **Dark Mode**: System-preference based theming with smooth transitions
- **SEBI Compliance**: Mandatory disclaimers on all performance-related views

### Phase 1: Core UX Enhancements (Next Sprint)
**Goal**: Improve discoverability, comparison, and user feedback mechanisms

- [ ] **Advanced Filtering & Sorting**
  - Multi-select category filters (Equity, Debt, Hybrid, ELSS, etc.)
  - Sort by NAV, returns, AUM, expense ratio
  - Save and persist filter preferences
  
- [ ] **Fund Comparison Tool**
  - Side-by-side comparison of up to 3 funds
  - Comparative metrics: returns, volatility, expense ratios
  - Visual diff charts for NAV performance
  
- [ ] **Watchlist/Favorites**
  - Star funds for quick access
  - Sync watchlist to IndexedDB
  - Quick-add from search results
  
- [ ] **Loading Skeletons**
  - Content placeholders during data fetch
  - Reduce perceived load time
  - Smooth skeleton-to-content transitions
  
- [ ] **Toast Notification System**
  - User action feedback (saved, exported, errors)
  - Non-intrusive dismissible toasts
  - Queue management for multiple notifications
  
- [ ] **Export Capabilities**
  - CSV export for portfolio holdings
  - PDF report generation for fund analysis
  - JSON import/export for portfolio backup

### Phase 2: Advanced Visualizations (Q1 2026)
**Goal**: Rich data visualizations for better investment insights

- [ ] **Category Heatmap**
  - Performance heatmap by fund category
  - Color-coded returns (1Y, 3Y, 5Y)
  - Interactive drill-down to funds
  
- [ ] **Comparative Charts**
  - Multi-fund NAV overlay
  - Normalized returns comparison
  - Risk-return scatter plots
  
- [ ] **Returns Distribution**
  - Historical returns bar charts (1Y/3Y/5Y)
  - Rolling returns visualization
  - Benchmark comparison overlays
  
- [ ] **SIP Projection Charts**
  - Investment growth curve
  - Contributions vs returns breakdown
  - Scenario analysis (best/worst/average cases)

### Phase 3: Accessibility & Mobile (Q1 2026)
**Goal**: World-class accessibility and mobile-first experience

- [ ] **Keyboard Navigation**
  - Shortcuts for common actions (search, compare, export)
  - Vim-style navigation option
  - Keyboard shortcut help modal (`?`)
  
- [ ] **Enhanced ARIA Support**
  - Screen reader optimizations
  - Semantic HTML improvements
  - Focus management for modals/dialogs
  
- [ ] **Mobile Optimizations**
  - Bottom sheet navigation for filters
  - Swipe gestures (fund cards, charts)
  - Pull-to-refresh for data updates
  - Optimized touch targets (min 44x44px)
  
- [ ] **Responsive Charts**
  - Touch-friendly chart interactions
  - Pinch-to-zoom for detailed views
  - Haptic feedback on mobile devices

### Phase 4: Power User Features (Q2 2026)
**Goal**: Advanced tools for sophisticated investors

- [ ] **Goal-Based Planner**
  - Define financial goals (retirement, education, etc.)
  - Recommended fund allocations
  - Track goal progress
  
- [ ] **Portfolio Rebalancing**
  - Suggested rebalancing actions
  - Drift detection from target allocation
  - Tax-efficient rebalancing suggestions
  
- [ ] **Tax Calculators**
  - LTCG/STCG calculator
  - Tax harvesting opportunities
  - Indexation benefit calculator
  
- [ ] **Fund Screener**
  - Advanced filtering (Sharpe ratio, alpha, beta)
  - Multi-criteria search
  - Save custom screens
  
- [ ] **Benchmark Comparison**
  - Fund vs Nifty/Sensex overlay
  - Alpha/Beta calculations
  - Relative performance tracking

### Phase 5: Onboarding & Education (Q2 2026)
**Goal**: Guide new users and educate on mutual fund investing

- [ ] **Interactive Onboarding**
  - First-time user tour
  - Feature highlights
  - Sample portfolio setup
  
- [ ] **Contextual Help**
  - Tooltips for complex metrics
  - Inline definitions (CAGR, XIRR, etc.)
  - Guided feature tours
  
- [ ] **Educational Content**
  - FAQ section with search
  - Investment basics articles
  - Video tutorial integration
  
- [ ] **Feature Announcements**
  - In-app "What's New" modal
  - Changelog viewer
  - Beta feature opt-in

### Long-Term Vision (2026+)
- AI-powered fund recommendations (ethical, explainable)
- Community-driven fund reviews (moderated, SEBI-compliant)
- Multi-currency support for NRI investors
- Integration with CAS import (CAMS/Karvy)
- Real-time alerts (price targets, portfolio rebalancing)

---

## Contributing to UI/UX

When implementing UI/UX enhancements, follow these principles:

1. **Compliance First**: Every performance metric must show SEBI disclaimer
2. **Offline Resilience**: All features must gracefully degrade offline
3. **Accessibility**: WCAG 2.1 AA minimum, aim for AAA where feasible
4. **Performance**: Lighthouse score >90, LCP <2.5s, FID <100ms
5. **Mobile-First**: Design for 320px viewport, enhance for larger screens
6. **Design System**: Use existing CSS variables and component patterns
7. **User Testing**: Validate with real users before major releases

See `AGENTS.md` for detailed component patterns and `copilot-instructions.md` for coding standards.
