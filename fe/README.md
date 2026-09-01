# PEA VOC Dashboard

Voice of Customer dashboard for the Provincial Electricity Authority (PEA). Built with React, TypeScript, Vite, Tailwind CSS, and Recharts. Currently wired up to mock data — see `src/mocks/dashboardMock.ts` and the `// TODO: BACKEND INTEGRATION POINT` comments in `src/services/api.ts` for where the real backend will plug in.

Implements the first of four planned pages: **PEA Complaint 2568 Overall**. See [frontend-spec-en.md](../frontend-spec-en.md) / [frontend-spec-th.md](../frontend-spec-th.md) for the full spec.

## Getting started

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — type-check and build for production
- `npm run lint` — run oxlint
- `npm run preview` — preview the production build

## Project structure

- `src/types/dashboard.ts` — shared TypeScript interfaces (the data contract)
- `src/mocks/dashboardMock.ts` — mock data matching those interfaces
- `src/services/api.ts` — mock service layer, marked with backend integration points
- `src/hooks/` — data-fetching hooks
- `src/components/layout/` — header, sidebar
- `src/components/dashboard/` — filter bar, KPI cards, detail table, charts section
- `src/components/charts/` — reusable horizontal bar chart
- `src/pages/OverallPage.tsx` — the Overall page
