# Quick Start Implementation Guide
## Indian Mutual Funds Data PWA

**Blueprint**: See `MF-Data-PWA-Blueprint.pdf` for complete technical details  
**Time to First Deploy**: ~4 hours (MVP skeleton)

---

## Phase 0: Immediate Setup (30 minutes)

### 1. Create GitHub Repository

```bash
# Create new directory
mkdir mf-data-pwa
cd mf-data-pwa

# Initialize git
git init
echo "node_modules" > .gitignore
echo ".env" >> .gitignore
echo "dist" >> .gitignore

# Create main branch
git checkout -b main
```

### 2. Setup Monorepo Structure

```bash
# Install Turborepo
npm install -g turbo
npx create-turbo@latest

# Or manual setup
mkdir -p apps/{web,api} packages/{ui,utils,types}
```

### 3. Connect Render.com

1. Go to https://dashboard.render.com
2. **New** → **Web Service**
3. Connect your GitHub account
4. Select repository: `iAn-P1nt0/mf-data-pwa`
5. **DON'T deploy yet** - we'll configure first

---

## Phase 1: Backend Skeleton (2 hours)

### Step 1: Initialize Express API

```bash
cd apps/api
npm init -y

# Install dependencies
npm install express@5 cors dotenv
npm install -D typescript @types/node @types/express tsx nodemon

# TypeScript config
npx tsc --init
```

**`apps/api/tsconfig.json`**:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

**`apps/api/src/index.ts`**:
```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Test endpoint - Fetch from MFapi.in
app.get('/api/funds', async (req, res) => {
  try {
    const response = await fetch('https://api.mfapi.in/mf');
    const data = await response.json();
    res.json({ 
      success: true, 
      count: data.length,
      funds: data.slice(0, 10) // First 10 funds
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch funds' 
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
});
```

**Available routes**:
- `GET /api/health` – checks API + DB connectivity.
- `GET /api/funds?limit=10&q=hdfc` – fetches list of funds from MFapi.in with optional fuzzy filter and returns SEBI disclaimer metadata.

**`apps/api/package.json`** scripts:
```json
{
  "scripts": {
    "dev": "nodemon --exec tsx src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

**Test it**:
```bash
npm run dev
# Visit http://localhost:3001/api/health
```

### Step 2: Add Prisma + PostgreSQL

```bash
npm install prisma @prisma/client
npm install -D prisma

# Initialize Prisma
npx prisma init
```

**`apps/api/prisma/schema.prisma`**:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Scheme {
  id             Int      @id @default(autoincrement())
  schemeCode     String   @unique @db.VarChar(10)
  schemeName     String   @db.VarChar(500)
  amcName        String?  @db.VarChar(200)
  schemeCategory String?  @db.VarChar(200)
  schemeType     String?  @db.VarChar(100)
  isinGrowth     String?  @db.VarChar(20)
  isinDividend   String?  @db.VarChar(20)
  metadata       Json?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  navHistory NavHistory[]

  @@index([schemeCode])
  @@index([amcName])
  @@map("schemes")
}

model NavHistory {
  id         BigInt   @id @default(autoincrement())
  schemeCode String   @db.VarChar(10)
  navDate    DateTime @db.Date
  navValue   Decimal  @db.Decimal(12, 4)
  createdAt  DateTime @default(now())

  scheme Scheme @relation(fields: [schemeCode], references: [schemeCode])

  @@unique([schemeCode, navDate])
  @@index([schemeCode, navDate(sort: Desc)])
  @@map("nav_history")
}
```

**`.env`** (Local development):
```env
DATABASE_URL="postgresql://user:password@localhost:5432/mf_data?schema=public"
PORT=3001
```

**Run migration** (after Render PostgreSQL is ready):
```bash
npx prisma migrate dev --name init
```

> Render free-tier roles cannot terminate other sessions, so `prisma migrate dev` may fail remotely. In that case, generate SQL locally with:
> ```bash
> DATABASE_URL="<render-url>" npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/<timestamp>_init/migration.sql
> DATABASE_URL="<render-url>" npx prisma migrate deploy
> ```
> This produces a migration file you commit while applying it via `prisma migrate deploy`.

### Step 3: Create MFapi.in Service

### Step 4: Scaffold AMFI sync script (optional while API stabilizes)

Create `apps/api/scripts/amfi-sync.ts` with a placeholder downloader that fetches `NAVAll.txt`, saves it under `tmp/`, and prepares for Prisma upserts. Run it manually via:

```bash
npm run sync:amfi --workspace=apps/api
```

The parsing/upsert logic is a TODO until the API and database layer are fully validated.

**`apps/api/src/services/MFApiService.ts`**:
```typescript
interface FundMeta {
  fund_house: string;
  scheme_type: string;
  scheme_category: string;
  scheme_code: string;
  scheme_name: string;
}

interface NavData {
  date: string;
  nav: string;
}

interface FundResponse {
  meta: FundMeta;
  data: NavData[];
  status: string;
}

export class MFApiService {
  private baseUrl = 'https://api.mfapi.in/mf';

  async getAllFunds(): Promise<any[]> {
    const response = await fetch(this.baseUrl);
    if (!response.ok) throw new Error('Failed to fetch funds');
    return response.json();
  }

  async getFundDetails(schemeCode: string): Promise<FundResponse> {
    const response = await fetch(`${this.baseUrl}/${schemeCode}`);
    if (!response.ok) throw new Error(`Fund ${schemeCode} not found`);
    return response.json();
  }

  async getHistoricalNav(
    schemeCode: string,
    startDate?: string,
    endDate?: string
  ): Promise<FundResponse> {
    let url = `${this.baseUrl}/${schemeCode}`;
    if (startDate && endDate) {
      url += `?start=${startDate}&end=${endDate}`;
    }
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch NAV history');
    return response.json();
  }
}
```

---

## Phase 2: Frontend Skeleton (1.5 hours)

### Step 1: Initialize Vite React App

```bash
cd apps/web
npm create vite@latest . -- --template react-ts

# Install dependencies
npm install
npm install react-router-dom @reduxjs/toolkit react-redux
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**`apps/web/tailwind.config.js`**:
```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**`apps/web/src/index.css`**:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Step 2: Basic App Structure

**`apps/web/src/App.tsx`**:
```tsx
import { useState, useEffect } from 'react';

interface Fund {
  schemeCode: string;
  schemeName: string;
}

function App() {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3001/api/funds')
      .then(res => res.json())
      .then(data => {
        setFunds(data.funds || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch funds:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white p-4">
        <h1 className="text-2xl font-bold">MF Data - Mutual Funds Tracker</h1>
      </header>
      
      <main className="container mx-auto p-4">
        <h2 className="text-xl font-semibold mb-4">Available Funds</h2>
        
        {loading ? (
          <p>Loading funds...</p>
        ) : (
          <div className="grid gap-4">
            {funds.map(fund => (
              <div 
                key={fund.schemeCode}
                className="bg-white p-4 rounded shadow"
              >
                <p className="text-sm text-gray-500">{fund.schemeCode}</p>
                <p className="font-medium">{fund.schemeName}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
```

**Test it**:
```bash
npm run dev
# Visit http://localhost:5173
```

### Step 3: Add PWA Support

```bash
npm install -D vite-plugin-pwa
```

**`apps/web/vite.config.ts`**:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'MF Data - Mutual Funds Tracker',
        short_name: 'MF Data',
        description: 'Track NAV, analyze mutual funds, manage portfolio',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
});
```

---

## Phase 3: Deploy to Render (1 hour)

### Step 1: Create Render Configuration

**Root `render.yaml`**:
```yaml
services:
  # Backend API
  - type: web
    name: mf-data-api
    env: node
    region: singapore
    plan: free
    buildCommand: cd apps/api && npm install && npm run build
    startCommand: cd apps/api && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: mf-postgres
          property: connectionString
    healthCheckPath: /api/health

databases:
  - name: mf-postgres
    plan: free
    databaseName: mf_data
    user: mf_user
```

### Step 2: Setup Render PostgreSQL

1. Render Dashboard → **New** → **PostgreSQL**
2. Name: `mf-postgres`
3. Database: `mf_data`
4. Plan: **Free**
5. Create Database
6. Copy **Internal Database URL**

### Step 3: Run Migrations on Render

```bash
# Set DATABASE_URL from Render
export DATABASE_URL="postgresql://..."

# Run migration
cd apps/api
npx prisma migrate deploy
```

### Step 4: Deploy Backend

```bash
# Commit everything
git add .
git commit -m "Initial backend setup"
git push origin main

# Render will auto-deploy
```

### Step 5: Deploy Frontend (Vercel - Recommended)

Frontend should be separate for better performance:

```bash
cd apps/web
npx vercel --prod
```

**OR** use Render Static Site:
1. New → **Static Site**
2. Build Command: `cd apps/web && npm install && npm run build`
3. Publish Directory: `apps/web/dist`

---

## Phase 4: Test End-to-End (30 minutes)

### API Testing

```bash
# Test deployed API
curl https://mf-data-api.onrender.com/api/health

# Test funds endpoint
curl https://mf-data-api.onrender.com/api/funds
```

### Frontend Testing

1. Visit deployed URL
2. Check if funds load
3. Test PWA install (Chrome: ⋮ → Install App)
4. Test offline (DevTools → Network → Offline)

---

## Next Steps (Immediate Priorities)

### Week 1 Tasks

1. **Implement Redis Caching**:
   - Add Render Key-Value database
   - Wrap API responses in cache middleware

2. **Add Fund Details Page**:
   - Route: `/funds/:schemeCode`
   - Show NAV chart (use Recharts)

3. **Implement Search**:
   - Fuzzy search on fund name/AMC
   - Add to API endpoint: `GET /api/funds/search?q=hdfc`

4. **Portfolio Tracker (Client-Side)**:
   - Use IndexedDB (Dexie.js)
   - Add/remove holdings
   - Calculate current value

### Week 2 Tasks

1. **SIP Calculator**:
   - Standalone page with formula
   - Show maturity amount, returns

2. **Historical NAV Sync**:
   - Cron job to fetch daily NAV
   - Store in PostgreSQL

3. **Performance Optimization**:
   - Code splitting (React.lazy)
   - Image optimization
   - Lighthouse audit

---

## Troubleshooting

### Common Issues

**Issue**: Render free tier sleeps after 15 minutes  
**Solution**: PWA works offline; show cached data on wake-up

**Issue**: CORS errors from API  
**Solution**: Add CORS middleware in Express:
```typescript
app.use(cors({
  origin: ['http://localhost:5173', 'https://your-frontend.vercel.app']
}));
```

**Issue**: Prisma migration fails on Render  
**Solution**: Run migrations manually via Render Shell:
```bash
cd apps/api
npx prisma migrate deploy
```

---

## Key Commands Reference

```bash
# Development
npm run dev              # Start all services (use Turbo)
cd apps/api && npm run dev   # Backend only
cd apps/web && npm run dev   # Frontend only

# Build
npm run build            # Build all
cd apps/api && npm run build # Backend build

# Deploy
git push origin main     # Triggers Render auto-deploy

# Database
npx prisma migrate dev   # Create migration
npx prisma studio        # Open database GUI
npx prisma db push       # Push schema changes
```

---

## Resources

- **Blueprint PDF**: Complete technical details (25 pages)
- **MFapi.in Docs**: https://www.mfapi.in
- **Render Docs**: https://render.com/docs
- **Prisma Docs**: https://www.prisma.io/docs

---

**Ready to start? Run the Phase 0 commands and you'll have a working skeleton in 4 hours!**

For questions, open issues on GitHub: `github.com/iAn-P1nt0/mf-data-pwa`
