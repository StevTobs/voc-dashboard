# PEA VOC Dashboard — Rounds 1–3

React + Vite UI foundation. Requires Node.js 20.19+ or 22.12+ (tested with Node 24).

## Run

```sh
npm ci
npm run dev
```

Open the URL printed by Vite, then use the navigation tabs:
- `/#/overview` — service overview with grouped closed/in-progress/total request shells, two donut shells on the left, and a main chart on the right.
- `/#/complaint-detail` — six chart containers in two columns on desktop.

```sh
npm run build
npm run preview
```

## Manual verification

1. Open both routes directly, switch tabs, and use browser back/forward.
2. Check at desktop, tablet, and 375px mobile widths: no horizontal page overflow, cards stack, and controls remain accessible.
3. Press ค้นหา. An explicit preview-only status appears; no result data is fabricated. Press ล้างค่า to show reset feedback. Filter controls remain disabled until the filter implementation round.
4. Tab through navigation and controls; verify visible focus and the skip-to-content link.
5. Confirm overview KPI values and charts reconcile with CSV records. The filter note shows the accepted CSV record count, and the heading shows the latest source-record date.

## Scope and assumptions

The supplied reference image guides the purple single-row header, inline filters, gray grouped status cards, rounded donut panels, white canvas, and large right-hand chart. Reference sample numbers, percentages, update timestamps, and chart segments are deliberately not reproduced: dashboard metrics are calculated from the validated CSV. SLA day thresholds are also deferred until business rules are implemented. The second tab retains the Round 1 complaint-detail destination; a power-quality page is outside this round. The header uses the user-provided logo at `public/images/pea-logo.png`, preserving its aspect ratio; the user avatar remains generic. The interface uses bundled Prompt weights 400/500/600/700 for Thai and English, with system fallbacks. Fonts load locally without an external request; the SIL Open Font License is included in `public/fonts/OFL-Prompt.txt`. The exact font cannot be confirmed from the screenshot alone.

Hash routing supports direct links on static hosts. The user area is display-only. Filters are explicitly disabled placeholders; Search/Reset only demonstrate shell interactions. Overview and detail charts render CSV-derived values. Area names and legend colors are presentation labels taken from the reference.

Round 2 is implemented: the shared provider loads and validates `public/data/complaints.csv`. See `src/data/README.md` for the schema, aggregation APIs, error behavior and CSV editing checks. Run `npm test` for data tests. Round 3 now renders the overview KPI cards, donuts and stacked office chart. Interactive filters, area/office inline selection validation, cross-filtering and hierarchy interactions remain deferred.

Desktop viewport fit: at widths of at least 1024px and heights of at least 700px, both pages allocate the remaining viewport height to their chart grids so the full dashboard fits without scrolling. Verified at 1024×700, 1024×768, 1280×720, 1366×768, 1440×900, 1544×900, and 1920×1080, including Search feedback. Smaller or zoomed viewports retain normal scrolling for readability; content is not clipped with overflow hiding.

## Complaint-detail reference update

The complaint-detail page now scrolls vertically and uses six CSV-backed horizontal charts: top ten offices, contact channels, voice types, and stacked Level 2–4 categories. All charts share the provider's validated dataset. Hover or keyboard-focus a bar for its breakdown; long lists scroll within a chart. Font sizes are enlarged on this page only. The office filter is a disabled placeholder, like the existing filters; filtering and cascading selections are not implemented by this visual update. Overview remains unchanged and retains desktop viewport fit. The reference's title is used, but no power-quality-only restriction is applied to the dataset.

Overview donut cross-filtering: click a region or voice slice to filter the shared overview dataset. Region and voice selections intersect; KPI cards, both donuts and office bars reconcile to that selection. Click the selected slice again, remove its chip, use แสดงทั้งหมด, or press ล้างค่า to clear selections. Enter/Space also activates focused slices. This is limited to donut-driven overview interaction; the main filter controls and detail-page interactions remain deferred.
