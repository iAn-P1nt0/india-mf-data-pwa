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
