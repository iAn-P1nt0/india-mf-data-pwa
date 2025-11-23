# Technical Decision Matrix & FAQ
## Indian Mutual Funds Data PWA

**Companion to**: MF-Data-PWA-Blueprint.pdf & Quick-Start-Guide.md

---

## Decision Matrix: Key Technical Choices

### 1. Database: PostgreSQL vs MongoDB

| Criterion | PostgreSQL ✅ | MongoDB |
|-----------|--------------|----------|
| **NAV Time-Series Data** | Native date indexing, efficient range queries | Requires compound indexes |
| **Complex Aggregations** | SQL JOINs, window functions (rolling returns) | Aggregation pipeline (more verbose) |
| **ACID Compliance** | Full ACID guarantees | Document-level ACID (4.0+) |
| **Schema Changes** | Migrations required | Flexible schema |
| **Render Free Tier** | 1 GB storage | Not available |
| **XIRR/Sharpe Calculations** | Can compute in SQL (CTEs, recursive queries) | Must compute in application layer |
| **Data Consistency** | Strict referential integrity | Manual consistency checks |

**Verdict**: PostgreSQL - NAV data is inherently relational with strict time-series requirements.

---

### 2. State Management: Redux Toolkit vs Zustand vs Context API

| Criterion | Redux Toolkit ✅ | Zustand | Context API |
|-----------|------------------|---------|-------------|
| **Learning Curve** | Medium (boilerplate reduced from Redux) | Low | Low |
| **DevTools** | Excellent time-travel debugging | Basic | None |
| **Performance** | Optimized selectors, memoization | Good | Re-renders can be problematic |
| **TypeScript Support** | Excellent | Good | Manual typing |
| **Middleware** | Built-in (thunk, logger) | Custom | Manual |
| **Complexity** | Medium (slices, actions, reducers) | Low (simple stores) | Low |

**Verdict**: Redux Toolkit - Complex app with funds, portfolio, user preferences needs centralized state.

**Alternative**: Zustand for MVP (faster dev), migrate to RTK later if needed.

---

### 3. Charts: Recharts vs Chart.js vs D3.js

| Criterion | Recharts ✅ | Chart.js | D3.js |
|-----------|------------|----------|-------|
| **React Integration** | Native React components | Wrapper needed (react-chartjs-2) | Manual integration |
| **Declarative API** | Yes (`<LineChart>`, `<AreaChart>`) | Imperative | Imperative |
| **Customization** | Medium (pre-built components) | High (plugins) | Unlimited |
| **Performance** | Good (SVG-based) | Excellent (Canvas) | Depends on implementation |
| **TypeScript** | Good | Good | Complex |
| **Bundle Size** | ~85 KB | ~50 KB | ~250 KB (full) |

**Verdict**: Recharts - Best balance of ease-of-use and customization for NAV charts.

**For Complex Visualizations** (heat maps, candlestick): Consider lightweight-charts (TradingView)

---

### 4. Caching: Redis vs In-Memory (Node cache) vs No Cache

| Criterion | Redis ✅ | In-Memory | No Cache |
|-----------|---------|-----------|----------|
| **Shared Across Instances** | Yes | No (each instance has own cache) | N/A |
| **Persistence** | Optional (RDB/AOF) | Lost on restart | N/A |
| **Render Free Tier** | 100 MB Key-Value | N/A | N/A |
| **Performance** | ~1ms latency | <1ms | N/A |
| **Use Case Fit** | Multi-instance, persistent cache | Single instance only | API rate limits ignored |

**Verdict**: Redis - Required for shared cache (Render may auto-scale to multiple instances).

**Fallback**: If Redis unavailable, serve uncached (acceptable on free tier with low traffic).

---

### 5. Frontend Deployment: Vercel vs Render Static Site vs Netlify

| Criterion | Vercel ✅ | Render Static | Netlify |
|-----------|----------|---------------|---------|
| **Free Tier Bandwidth** | 100 GB/month | 100 GB/month | 100 GB/month |
| **Build Minutes** | Unlimited | Shared 500 min/month | 300 min/month |
| **Edge CDN** | Global (197 locations) | Global | Global |
| **SSR Support** | Native (Next.js) | Manual (Node server) | Manual |
| **Custom Domains** | Free (custom + vercel.app) | Free | Free |
| **Preview Deployments** | Automatic (PR-based) | Yes | Yes |

**Verdict**: Vercel - Superior DX, automatic preview deployments, better for React apps.

**Alternative**: If you want monorepo simplicity, use Render Static Site.

---

## Frequently Asked Questions

### API & Data

**Q: How often should I sync NAV data from AMFI/MFapi.in?**

**A**: Once daily at 9 PM IST (post-market hours). NAV is declared by 9 PM as per SEBI regulations.

**Cron Expression**: `0 21 * * *` (9 PM IST = 15:30 UTC)

**Why not real-time?**
- NAV is static after declaration (doesn't change intraday)
- Reduces API load and costs
- Render cron job free tier sufficient

---

**Q: Should I store all historical NAV data or fetch on-demand?**

**A**: **Hybrid approach**:
- **Store**: Last 5 years NAV for top 1000 funds (by AUM) - ~365 days × 5 years × 1000 = 1.8M rows (~200 MB)
- **Fetch on-demand**: Lesser-known funds or data >5 years old

**Reason**: PostgreSQL free tier (1 GB) can't hold 20+ years data for all 5000 funds.

---

**Q: MFapi.in vs AMFI daily file - which to use?**

**A**: **Use both**:
- **MFapi.in** for on-demand queries (fund details, recent NAV)
- **AMFI file** (`https://www.amfiindia.com/spages/NAVAll.txt`) for bulk daily sync

**AMFI File Format**:
```
Scheme Code;ISIN Div;ISIN Growth;Scheme Name;NAV;Date
119551;;INF179KA1JK5;HDFC Index Fund-NIFTY 50 Plan-Direct Plan-Growth;196.234;22-Nov-2025
```

**Parsing Script**:
```typescript
async function syncAMFINav() {
  const response = await fetch('https://www.amfiindia.com/spages/NAVAll.txt');
  const text = await response.text();
  
  const lines = text.split('\n');
  const navData = lines
    .slice(1) // Skip header
    .filter(line => line.trim())
    .map(line => {
      const [code, , isin, name, nav, date] = line.split(';');
      return { code, name, nav: parseFloat(nav), date };
    });

  // Bulk insert to PostgreSQL
  await prisma.navHistory.createMany({
    data: navData.map(d => ({
      schemeCode: d.code,
      navDate: new Date(d.date),
      navValue: d.nav
    })),
    skipDuplicates: true // Prevent errors on re-runs
  });
}
```

---

### PWA & Offline

**Q: What happens when user opens app after 15+ min idle (Render spin-down)?**

**A**: **User Experience Flow**:

1. User opens app (offline mode active via service worker)
2. App shows **last cached data** from IndexedDB/Service Worker cache
3. Background: Fetch request sent to Render API
4. Render cold starts (~30-60 seconds on free tier)
5. Once API responds, fresh data replaces cached data
6. User sees "Data updated" notification

**Implementation**:
```typescript
// Show stale data immediately, update in background
const { data, isLoading, isFetching } = useQuery(
  ['funds', schemeCode],
  () => fetchFundDetails(schemeCode),
  {
    staleTime: 1000 * 60 * 60 * 6, // 6 hours
    cacheTime: 1000 * 60 * 60 * 24, // 24 hours
    refetchOnMount: 'always',
    initialData: cachedData // From IndexedDB
  }
);

// Show toast when data updates
useEffect(() => {
  if (!isLoading && isFetching) {
    toast.info('Updating data...');
  }
}, [isFetching]);
```

---

**Q: How much data can I store offline in IndexedDB?**

**A**: **Browser Limits**:
- Chrome/Edge: ~60% of available disk space (quota API)
- Firefox: ~50% of available disk space
- Safari: ~1 GB total for all sites

**Practical Limit**: Store ~100 MB max (conservative):
- Portfolio holdings: ~100 KB
- Cached fund details (50 funds): ~5 MB
- Cached NAV charts (50 funds, 1 year): ~20 MB
- UI assets (service worker cache): ~5 MB

**Total**: ~30 MB (well within limits)

---

### Performance & Optimization

**Q: How to optimize PostgreSQL queries for NAV historical data?**

**A**: **Indexing Strategy**:

```sql
-- Essential indexes (already in schema)
CREATE INDEX idx_nav_scheme_date ON nav_history(scheme_code, nav_date DESC);

-- For range queries (date filters)
CREATE INDEX idx_nav_date_brin ON nav_history USING BRIN (nav_date);

-- Partial index for recent data (90% of queries)
CREATE INDEX idx_nav_recent 
  ON nav_history(scheme_code, nav_date DESC) 
  WHERE nav_date > CURRENT_DATE - INTERVAL '2 years';
```

**Query Optimization**:
```sql
-- BAD: Full table scan
SELECT * FROM nav_history WHERE scheme_code = '119551';

-- GOOD: Use date range + LIMIT
SELECT * FROM nav_history 
WHERE scheme_code = '119551' 
  AND nav_date >= CURRENT_DATE - INTERVAL '1 year'
ORDER BY nav_date DESC
LIMIT 365;
```

**Prisma Query**:
```typescript
const navData = await prisma.navHistory.findMany({
  where: {
    schemeCode: '119551',
    navDate: {
      gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    }
  },
  orderBy: { navDate: 'desc' },
  take: 365
});
```

---

**Q: How to handle 5000+ funds in search dropdown without lag?**

**A**: **Virtual Scrolling + Debounced Search**:

```bash
npm install @tanstack/react-virtual
```

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function FundSearchDropdown({ funds }: { funds: Fund[] }) {
  const [query, setQuery] = useState('');
  const [filteredFunds, setFilteredFunds] = useState(funds);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      const filtered = funds.filter(f => 
        f.schemeName.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredFunds(filtered);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, funds]);

  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: filteredFunds.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Each row ~60px
    overscan: 5
  });

  return (
    <div>
      <input 
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search funds..."
      />
      
      <div ref={parentRef} className="h-96 overflow-auto">
        <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
          {virtualizer.getVirtualItems().map(item => (
            <div
              key={item.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${item.size}px`,
                transform: `translateY(${item.start}px)`
              }}
            >
              {filteredFunds[item.index].schemeName}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Result**: Smooth rendering of 5000+ items with search.

---

### Compliance & Legal

**Q: Can I show predicted returns or recommendations?**

**A**: **NO - SEBI Restrictions**:

❌ **Prohibited**:
- "This fund will give 12% returns"
- "Buy this fund, it's best for retirement"
- "Recommended: HDFC Top 100 Direct Growth"
- Future return projections

✅ **Allowed**:
- Historical returns (with disclaimer)
- Risk metrics (Sharpe, Sortino) - factual
- Fund comparison (objective data only)
- SIP calculators (user inputs, no predictions)

**Safe Language**:
```typescript
// BAD
"Expected return: 12% per annum"

// GOOD
"Historical 5-year CAGR: 12.4% (Past performance is not indicative of future returns)"
```

**Disclaimer Template**:
```tsx
<div className="disclaimer">
  <strong>SEBI Disclaimer:</strong> Mutual fund investments are subject to market risks. 
  Read all scheme-related documents carefully before investing. Past performance is not 
  indicative of future returns. The information provided is for educational purposes only 
  and does not constitute investment advice.
</div>
```

---

**Q: Do I need user authentication for public NAV data?**

**A**: **No**, but:

**Public Data (No Auth)**:
- NAV browsing, search, historical charts
- Fund comparison
- SIP calculator

**Requires Auth** (if implementing):
- Syncing portfolio to server
- Email alerts/notifications
- MFCentral API integration (KYC status, CAS)

**Recommendation**: Launch MVP without auth. Add in Phase 2 if users request cloud sync.

---

### Monetization & Open Source

**Q: How to monetize without violating SEBI rules?**

**A**: **Compliant Revenue Models**:

✅ **Allowed**:
1. **GitHub Sponsors** - Accept donations for open-source work
2. **Premium API Access** - For developers (rate-limited free tier, unlimited paid)
3. **Affiliate Links** - Link to AMC websites (disclosure required)
4. **Whitelabel Licensing** - Sell enterprise license to wealth advisors
5. **Educational Content** - Paid courses on mutual fund investing

❌ **Prohibited**:
- Charging commission on transactions (need SEBI RIA license)
- Selling investment advice (need SEBI RIA license)
- Revenue sharing with AMCs/distributors (undisclosed conflict of interest)

**Example: Premium API Tier**:
```
Free: 100 requests/15 min
Pro ($9/month): 1000 requests/15 min + historical data API
Enterprise (Custom): Unlimited + white-label + priority support
```

---

**Q: Apache 2.0 vs MIT - which license?**

**A**: **Apache 2.0** (as per your requirement):

**Why Apache 2.0**:
- Explicit patent grant (protects contributors)
- Trademark protection (your branding safe)
- More business-friendly (enterprises prefer)
- Compatible with MIT/BSD (can use their libraries)

**License Header** (add to all files):
```typescript
/**
 * Copyright 2025 Ian Pinto
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
```

---

## Architecture Decisions Log (ADL)

### ADR-001: Use PostgreSQL over MongoDB

**Context**: Need database for NAV time-series data and portfolio.

**Decision**: PostgreSQL

**Rationale**:
- NAV data is relational (schemes ↔ historical NAV)
- Complex aggregations (XIRR, rolling returns) easier in SQL
- ACID guarantees critical for portfolio accuracy
- Render free tier offers PostgreSQL (1 GB), not MongoDB

**Consequences**: 
- ✅ Better query performance for time-series
- ❌ Requires schema migrations on changes

---

### ADR-002: Client-Side Portfolio Storage (IndexedDB)

**Context**: Users want to track portfolio without creating accounts.

**Decision**: Store portfolio in browser IndexedDB, optional server sync.

**Rationale**:
- Privacy-first (no server storage of sensitive holdings)
- Works offline
- No authentication complexity for MVP
- Aligns with TrustVault philosophy

**Consequences**:
- ✅ Maximum privacy
- ❌ Data lost if user clears browser data (mitigated by export feature)

---

### ADR-003: SSR with Vite over Next.js

**Context**: Need SEO-friendly, fast-loading PWA.

**Decision**: Vite SSR with custom Express integration.

**Rationale**:
- Full control over SSR logic
- Smaller bundle size vs Next.js
- Better alignment with Express backend (same deployment)
- You have Express expertise from recent contributions

**Consequences**:
- ✅ Faster builds, smaller footprint
- ❌ Manual SSR setup (no framework magic)

---

## Troubleshooting Guide

### Issue: "Prisma Client initialization error"

**Symptom**: `PrismaClient is unable to run in the browser`

**Cause**: Trying to import Prisma in frontend code.

**Solution**: Never import `@prisma/client` in React components. Use API routes.

```typescript
// ❌ WRONG (frontend)
import { prisma } from '@/lib/prisma';

// ✅ CORRECT (backend API route)
import { prisma } from '../config/database';
```

---

### Issue: CORS error on API requests

**Symptom**: `Access-Control-Allow-Origin` error in browser console.

**Solution**: Add CORS middleware in Express:

```typescript
import cors from 'cors';

app.use(cors({
  origin: [
    'http://localhost:5173',           // Vite dev
    'https://mf-data.vercel.app',      // Production
    'https://mf-data-preview-*.vercel.app' // Preview deploys
  ],
  credentials: true
}));
```

---

### Issue: Render service keeps spinning down

**Symptom**: First request after idle takes 60+ seconds.

**Solution**: This is **expected behavior** on free tier. Mitigate with:

1. **UptimeRobot** (free) - Ping every 5 min to keep awake
   - Caveat: Uses free tier hours (may hit 750 hr limit)

2. **Accept it** - Show loading state, use service worker cache

3. **Upgrade to paid** ($7/month) - No spin-down

**Recommendation**: Accept it for MVP. PWA works offline anyway.

---

## Performance Benchmarks

### Target Metrics (Lighthouse)

| Metric | Target | Measurement |
|--------|--------|-------------|
| **First Contentful Paint** | <1.5s | Largest text/image render |
| **Largest Contentful Paint** | <2.5s | Main content visible |
| **Time to Interactive** | <3.0s | Page fully interactive |
| **Total Blocking Time** | <200ms | Main thread blocked time |
| **Cumulative Layout Shift** | <0.1 | Visual stability |

### API Response Times

| Endpoint | Target | Query |
|----------|--------|-------|
| `GET /api/funds` | <200ms | All funds list (cached) |
| `GET /api/funds/:code` | <300ms | Fund details + latest NAV |
| `GET /api/funds/:code/nav` | <500ms | Historical NAV (1 year) |
| `POST /api/portfolio/calculate` | <100ms | Client-side XIRR |

---

## Next Steps After MVP

### Phase 2 Features (Prioritized)

1. **CAS Upload Parser** (High Value):
   - Parse CAMS/KFintech PDF statements
   - Auto-populate portfolio
   - Libraries: `pdf-parse`, `pdfjs-dist`

2. **MFCentral Integration** (High Value):
   - KYC status check via PAN
   - Consolidated portfolio from RTAs
   - Requires: User auth (JWT), OTP flow

3. **Advanced Analytics** (Medium Value):
   - Sharpe/Sortino ratio
   - Rolling returns (3Y, 5Y)
   - Risk-return scatter plot

4. **Goal Planning** (Medium Value):
   - Retirement calculator
   - Education fund planner
   - EMI calculator

5. **Email Alerts** (Low Priority):
   - NAV milestone alerts
   - Portfolio rebalancing suggestions
   - Weekly summary emails

---

## Conclusion

You now have:
1. ✅ **25-page technical blueprint** (complete architecture)
2. ✅ **Quick-start guide** (4-hour MVP skeleton)
3. ✅ **Decision matrix & FAQ** (informed choices)

**Ready to build? Start with Phase 0 of the Quick-Start Guide!**

For detailed technical specs, refer to **MF-Data-PWA-Blueprint.pdf**.

---

**Questions or stuck?** Open an issue on GitHub or ping me!

**Happy building! 🚀**
