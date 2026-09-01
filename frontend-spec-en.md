# Frontend Build Prompt: PEA VOC Dashboard
> Use this as a prompt for Claude (in VS Code / Claude Code) to scaffold the frontend now, using mock data, while leaving clearly marked integration points for the real backend later.

---

## 1. Project Overview

Build a dashboard web app called **"PEA VOC Dashboard"** (Voice of Customer) for the Provincial Electricity Authority (PEA), showing complaint/feedback statistics. There are 4 pages total (left sidebar menu), but start by building the first page: **"PEA Complaint 2568 Overall"**.

**Recommended stack:** React + TypeScript + Vite, Tailwind CSS for styling, Recharts or Chart.js for charts, React Query or SWR for the future API layer (use local mock JSON/state for now).

**Color theme:** Mint-green/teal (Esri-like) — dark teal header, mint sidebar, pastel KPI cards (light blue, light green, light purple), dusty-rose colored horizontal bar charts.

**UI language:** All UI text is in Thai (as shown in the reference screenshots). Support a Thai font (e.g., Noto Sans Thai / Sarabun).

---

## 2. Screen Layout

1. **Header (top)**
   - "esri" logo + title "PEA VOC Dashboard"
   - Top right: user avatar + "Username : {username}"

2. **Sidebar (left)**
   - 4 menu items (with icons):
     - PEA Complaint 2568 Overall (active)
     - PEA Complaint 2568 Quality
     - PEA Complaint 2568 Service
     - PEA Complaint 2568 Corruption
   - "Log out" (ออกจากระบบ) button at the bottom

3. **Page heading**
   - Title: "PEA Complain Overall"
   - After the user clicks Search, this switches to a light-green success banner: "ข้อมูลได้ทำการอัพเดทเรียบร้อยแล้ว" (Data has been updated successfully)
   - Subtitle line: "วันที่อัพเดทข้อมูลล่าสุด: {last_updated_display}" (Last data update date)

4. **Filter bar**
   - Dropdowns: Status (สถานะ), Year (ปี), Quarter (ไตรมาส), Voice-type filter level 1 (กรองประเภทเสียง level 1)
   - "Search" button (ค้นหา, blue)
   - Row of region pill/toggle buttons (support multi-select): HQ (สำนักงานใหญ่), North (ภาคเหนือ), Northeast (ภาคตะวันออกเฉียงเหนือ), Central (ภาคกลาง), South (ภาคใต้)

5. **KPI cards (2 rows of 3 cards each)**
   - Row 1: Total complaints (large blue card), North, Northeast (light green)
   - Row 2: HQ (purple), Central, South (light green)
   - Status number row (no card border, just large number + label): In-progress count, Closed count, Cancelled count

6. **"Detail list" section (รายการรายละเอียด)** with an expand/zoom icon
   - Data table (toggle to show/hide) with columns:
     - Organization name, Duration (days), Meter/account number, Complaint type, Customer voice type, Case number
   - Pagination bottom-right: "1 - 5 of {total} items" + "Previous" (ก่อนหน้า) / "Next" (ถัดไป) buttons

7. **7 charts** (all horizontal bar charts, dusty-rose color, tooltip on hover showing the value)
   - Voice type level 1 (ประเภทของเสียง level 1) — x-axis up to ~20k
   - Issue Level 3 (ประเด็น Level 3) — has an internal scrollbar (partial view, scrollable), x-axis up to ~50
   - Topic Level 2 (หัวข้อ Level 2) — x-axis up to ~50
   - Sub-issue Level 4 (ประเด็นย่อย Level 4) — has an internal scrollbar, x-axis up to ~50
   - Channel (ช่องทางการแจ้ง) — x-axis up to ~400k
   - Top electric offices by complaint volume (จำนวนการไฟฟ้าที่มีเสียงสูงสุด) — has an internal scrollbar, x-axis up to ~2
   - Region zone (เขตพื้นที่) — x-axis up to ~200k

---

## 3. Data Contract / Frontend Variables Awaiting Backend Connection

> Create these TypeScript interfaces in `src/types/dashboard.ts`, generate matching mock data in `src/mocks/dashboardMock.ts` to use before the real backend is wired up, and create an empty service layer in `src/services/api.ts` that doesn't hit real endpoints yet (comment `// TODO: connect backend`) but returns data conforming to the same interfaces.

### 3.1 Filters
```ts
interface DashboardFilters {
  status: string[];        // options: "all" | "in_progress" | "closed" | "cancelled"
  year: string[];          // e.g. ["2568"], supports multi-select
  quarter: string[];       // e.g. ["1","2","3","4"]
  voiceTypeLevel1: string; // value from the "voice type filter level 1" dropdown
  regions: string[];       // multi-select: "hq" | "north" | "northeast" | "central" | "south"
}
```
**Frontend responsibility:** hold filter state, send `DashboardFilters` to the backend when the "Search" button is clicked.
**Awaiting backend:** an endpoint to fetch dropdown option lists for each filter, and an endpoint to submit filters and return all updated data (KPIs + table + charts).

### 3.2 KPI Summary
```ts
interface KpiSummary {
  totalComplaints: number;
  regionNorth: number;
  regionNortheast: number;
  regionHq: number;
  regionCentral: number;
  regionSouth: number;
  statusInProgress: number;
  statusClosed: number;
  statusCancelled: number;
  lastUpdatedAt: string; // ISO datetime string, e.g. "2026-08-03T10:00:00+07:00"
}
```
**Note:** `lastUpdatedAt` should be formatted into the Thai display string ("วันจันทร์ที่ 3 สค. 69 เวลา 10.00 น.") on the frontend itself — write a separate formatter function, don't wait for the backend to pre-format it.

### 3.3 Detail Table Rows
```ts
interface DetailTableRow {
  orgName: string;           // organization name, e.g. "กฟจ.เชียงใหม่"
  durationDays: number;      // duration in days
  meterNumber: string;       // meter/account number
  complaintType: string;     // complaint type, e.g. "Request", "Complaint"
  customerVoiceType: string; // customer voice type
  caseNumber: string;        // case number, e.g. "A123456789"
}

interface DetailTableResponse {
  rows: DetailTableRow[];
  pagination: {
    currentPage: number;
    pageSize: number;   // default = 5
    totalItems: number;
  };
}
```
**Frontend responsibility:** re-fetch from the backend whenever the pagination `currentPage` changes — prepare a `useDetailTable(filters, page)` hook.

### 3.4 Chart Data
```ts
interface ChartDataPoint {
  label: string;
  value: number;
}

interface DashboardCharts {
  voiceTypeLevel1: ChartDataPoint[];   // Voice type level 1
  topicLevel2: ChartDataPoint[];       // Topic level 2
  issueLevel3: ChartDataPoint[];       // Issue level 3
  subIssueLevel4: ChartDataPoint[];    // Sub-issue level 4
  channel: ChartDataPoint[];           // Reporting channel
  topElectricOffices: ChartDataPoint[];// Top electric offices by complaint volume
  regionZone: ChartDataPoint[];        // Region zone
}
```
**Frontend responsibility:** render horizontal bar charts from `ChartDataPoint[]`, show a tooltip `"{label}: {value}"` on hover/tap of each bar (see reference examples: "ข้อเสนอแนะ/ข้อคิดเห็น: 18k", "ปลอมแปลงใบเรียกชำระเงินของกฟภ.: 20", "PEA - Email: 20").
For charts with long lists (Issue Level 3, Sub-issue Level 4, Top electric offices), use a fixed-height container with internal vertical scroll.

### 3.5 Current User
```ts
interface CurrentUser {
  username: string; // shown top-right as "Username : {username}"
}
```

### 3.6 Combined API Response (optional, if backend prefers a single endpoint)
```ts
interface DashboardOverviewResponse {
  kpi: KpiSummary;
  table: DetailTableResponse;
  charts: DashboardCharts;
  appliedFilters: DashboardFilters;
}
```

---

## 4. Mock Data Requirements

- Create `src/mocks/dashboardMock.ts` with mock values matching the reference screenshots (e.g., totalComplaints = 1000000, regionNorth = 5000, etc.) so the UI looks correct immediately on first run.
- Include at least 40 mock rows for the table (so pagination can genuinely show "1 - 5 of 40 items").
- Mock the filter dropdown options up front (e.g., Year: 2568, 2567, 2566 / Status: All, Closed, In progress).

## 5. Mark All "Awaiting Backend" Points Clearly

At every point that currently reads from mock data, add a comment like this so it's easy to swap later:
```ts
// TODO: BACKEND INTEGRATION POINT
// GET /api/dashboard/overview?status=&year=&quarter=&voiceTypeLevel1=&regions=
// GET /api/dashboard/table?...&page=
// Currently using mockDashboardData instead
```

## 6. Responsive & Accessibility
- Build for desktop first (matching the reference screenshots), but collapse the sidebar into a hamburger menu on mobile screens.
- Every button/dropdown needs a readable label (aria-label).

## 7. Color Palette

> Approximate colors derived from the reference screenshots; fine-tune during implementation.

| UI Element | Description | Hex Code |
|---|---|---|
| Header background (top bar) | Dark teal | `#2E9B8F` |
| Sidebar background | Light mint green | `#D6F0E8` |
| Sidebar active menu item (text) | Dark teal | `#1F6E63` |
| Main page background | White / very light gray | `#F7FAFA` |
| KPI card "Total complaints" | Pastel cyan | `#7FE0EA` |
| KPI cards North/Northeast/Central/South | Pastel green | `#C9EFA0` |
| KPI card HQ | Pastel purple | `#D9C7F0` |
| Region pill button — active | Bright blue | `#4FA8E8` |
| Region pill button — text | White | `#FFFFFF` |
| "Search" button | Blue | `#2563EB` |
| Bar chart bars | Dusty rose | `#BFA6A0` |
| Chart tooltip background | Teal/mint | `#8FD9CE` |
| Success banner "Data updated successfully" | Light green | `#D9F2C4` |
| Body text | Dark gray | `#333333` |
| Border / grid line | Light gray | `#E2E8E8` |
| Avatar badge (user icon) | Bright pink | `#EC4899` |

**Ready-to-use CSS variables:**
```css
:root {
  --pea-header-bg: #2E9B8F;
  --pea-sidebar-bg: #D6F0E8;
  --pea-sidebar-active-text: #1F6E63;
  --pea-page-bg: #F7FAFA;
  --pea-kpi-cyan: #7FE0EA;
  --pea-kpi-green: #C9EFA0;
  --pea-kpi-purple: #D9C7F0;
  --pea-pill-active: #4FA8E8;
  --pea-search-btn: #2563EB;
  --pea-chart-bar: #BFA6A0;
  --pea-tooltip-bg: #8FD9CE;
  --pea-success-banner: #D9F2C4;
  --pea-text-body: #333333;
  --pea-border: #E2E8E8;
  --pea-avatar-badge: #EC4899;
}
```

**Instruction for Claude:** Add these color values into `tailwind.config.js` under `theme.extend.colors`, using camelCase keys matching the variables above (drop the `--pea-` prefix, e.g. `headerBg`, `sidebarBg`, `kpiCyan`), so they can be used directly via classes like `bg-headerBg`.

## 8. Pixel-Exact Layout Specification

> ⚠️ **Important:** To match the original reference images exactly, attach the original screenshot files (p1.png–p9.png) alongside this prompt every time you ask Claude Code to build it. The measurements below are approximations derived from proportions in the screenshots — for color, shadows, and other fine visual detail, Claude should always cross-check against the actual images for maximum accuracy. Instruct Claude: **"Treat the reference images as the source of truth — if a spec number conflicts with the image, follow the image."**

### 8.1 Reference Canvas
- Design on a container with `max-width` = **1200px**, centered on screen; page background outside the container = `#F7FAFA`
- Total page height ≈ 2400px (long scrolling page)

### 8.2 ASCII Wireframe
```
┌──────────────────────────────────────────────────────────────────┐
│ [esri]  PEA VOC Dashboard                    (avatar) Username:.. │ ← Header 90px
├───────────┬──────────────────────────────────────────────────────┤
│           │ PEA Complain Overall                                 │
│  Sidebar  │ Last updated: ...                                    │
│  155px    │ [Status▾][Year▾][Quarter▾][Voice-type filter▾] [Search]│
│           │ Area: (pill)(pill)(pill)(pill)(pill)                 │
│ • Overall │ ┌──────────────────────────────────────────────────┐ │
│ • Quality │ │  [Total]        [North]        [Northeast]        │ │
│ • Service │ │  [HQ]           [Central]      [South]            │ │
│ • Corrupt │ │  In progress      Closed         Cancelled        │ │
│           │ └──────────────────────────────────────────────────┘ │
│           │ Detail list ⊕                                        │
│           │ ┌──────────────────────────────────────────────────┐ │
│           │ │ [Table: 6 columns × 5 rows + pagination]           │ │
│           │ └──────────────────────────────────────────────────┘ │
│           │ ┌──────────────────────────────────────────────────┐ │
│           │ │ [Lv1 bar chart]      [Lv3 bar chart + scrollbar]  │ │
│           │ │ [Lv2 bar chart]      [Lv4 bar chart + scrollbar]  │ │
│           │ │ [Channel — full-width bar chart]                  │ │
│           │ └──────────────────────────────────────────────────┘ │
│           │ ┌──────────────────────────────────────────────────┐ │
│ ⟲ Logout  │ │ [Top offices + scrollbar]   [Region zone]         │ │
│           │ └──────────────────────────────────────────────────┘ │
└───────────┴──────────────────────────────────────────────────────┘
```

### 8.3 Header
| Element | Value |
|---|---|
| Height | 90px, full page width, `fixed`/`sticky` at top |
| Background | `--pea-header-bg` |
| Logo box | Black square 40×40px, 6px corner radius, white "esri" text centered, margin-left 24px |
| Title "PEA VOC Dashboard" | 16px after logo, font-size 26px, font-weight 700, white |
| Avatar (circle) | 56px diameter, right-aligned, margin-right 220px from the right edge, white circular background with an illustration inside |
| "Username : {username}" | 12px after avatar, font-size 16px, white, margin-right 24px from the right edge |

### 8.4 Sidebar
| Element | Value |
|---|---|
| Width | Fixed 155px, full height below header |
| Background | `--pea-sidebar-bg` |
| Top padding | 40px before the first menu item |
| Each menu item | ~70px tall, 20×20px icon with 20px left margin, two-line label text 10px after the icon, font-size 14px |
| Active state (first item) | Darker/bolder text (`--pea-sidebar-active-text`), no background highlight |
| "Log out" | Anchored to the bottom of the sidebar, 30px bottom margin, circular-arrow icon + text |

### 8.5 Main Content Area
| Element | Value |
|---|---|
| margin-left | 155px (sidebar width) + gutter |
| padding | 40px top, 24px left/right |
| Usable content width | ~980–1000px |

### 8.6 Page Title + Filter Bar
| Element | Value |
|---|---|
| Title "PEA Complain Overall" | font-size 30px, font-weight 700, color `--pea-text-body`, margin-bottom 8px |
| Success banner (replaces title after clicking Search) | Full content width, ~50px tall, background `--pea-success-banner`, 12px corner radius, vertically centered text with 24px left padding |
| Last-updated line | font-size 14px, gray, margin-top 6px, margin-bottom 24px |
| Filter row (dropdowns) | Horizontal `flex` layout, 20px gap between fields, each dropdown 38px tall, 6px corner radius, thin 1px `--pea-border` outline, inline label to the left of each box, font-size 14px |
| "Search" button | Right-aligned in the row, ~72px wide × 38px tall, background `--pea-search-btn`, white text, 6px corner radius |
| "Area:" (region pills) row | 16px top margin, label on the left followed by 5 pills with 10px gap, each pill 34px tall, 18px horizontal padding, fully rounded (border-radius 999px), background `--pea-pill-active`, white text, font-size 14px, font-weight 600 |

### 8.7 KPI Card Panel
| Element | Value |
|---|---|
| Container | 24px top margin, white background, 24px corner radius, 40px padding, subtle box-shadow (`0 2px 12px rgba(0,0,0,0.05)`) |
| Row 1 & 2 grid | 3 equal columns (`grid-template-columns: repeat(3, 1fr)`), 24px horizontal gap, 40px vertical gap between rows |
| Each "column" | Label on top (font-size 16px, font-weight 600, dark), 12px bottom margin, number card below, centered |
| Number card (pill) | ~280px wide × ~110px tall (large center cards "Total"/"HQ") or ~90px tall (region cards), fully rounded corners (border-radius = half the height), centered within the column, number centered vertically & horizontally, font-size 42px (large cards) / 34px (region cards), font-weight 700 |
| Card colors | Total = `--pea-kpi-cyan`, HQ = `--pea-kpi-purple`, all others = `--pea-kpi-green` |
| Row 3 (status numbers, no card) | 32px top margin, same 3 equal columns but no background, label on top font-size 16px, number below font-size 26px font-weight 700, centered per column |

### 8.8 Detail List + Table
| Element | Value |
|---|---|
| Heading "Detail list ⊕" | 24px top margin, 16px bottom margin, font-size 18px, font-weight 700, expand icon (⊕) 8px after the text, clickable (toggles the table) |
| Table container | White background, 20px corner radius, 24px padding |
| Table header row | font-weight 600, font-size 14px, dark gray, 1px `--pea-border` bottom border, 14px vertical padding |
| Column widths (approx % of 100%) | Org name 15% / Duration (days) 12% / Meter number 16% / Complaint type 14% / Customer voice type 30% / Case number 13% |
| Data rows | ~56px row height, 1px `--pea-border` bottom border, font-size 14px |
| Pagination footer | Right-aligned, 16px top margin, text "1 - 5 of {total} items" followed by "Previous" / "Next" buttons (plain text, no border), font-size 14px, gray; clickable buttons turn `--pea-search-btn` color |

### 8.9 Charts Container
| Element | Value |
|---|---|
| Container | 24px top margin, white background, 20px corner radius, 40px padding |
| Row 1 & 2 grid | 2 equal columns, 60px horizontal gap, 48px vertical gap |
| Chart sub-heading | Centered above chart, font-size 16px, font-weight 700, 16px bottom margin |
| Standard horizontal bar chart | Height fits the number of bars (~26px per bar + 14px gap), bar color `--pea-chart-bar`, slight right-corner rounding (4px), category label to the left of the chart at font-size 13px, bottom axis line with min/max numbers |
| Scrollable charts (Issue Lv3, Sub-issue Lv4, Top offices) | Fixed-height container ~260px, `overflow-y: auto`, thin gray scrollbar track shown on the right edge (6px) |
| Bar hover tooltip | Background `--pea-tooltip-bg`, 6px corner radius, 6px/10px padding, text format `"{label}: {value}"`, font-size 12px, with a small downward-pointing triangle arrow toward the bar |
| Row 3 (Channel) | Full container width, ~420px tall, showing 10 bars, axis 0 to 400k with a gridline at 200k |
| Bottom panel (separate container) | 24px top margin, white background, 20px corner radius, 40px padding, 2-column grid with 60px gap: "Top electric offices" (scrollable) on the left / "Region zone" on the right |

### 8.10 Spacing Between Major Sections
Every major container (KPI panel, table/detail list, main charts panel, bottom charts panel) should have equal vertical spacing between them = **24px**.

---

**Summary for Claude:** Read the full spec above, scaffold a React+TS+Tailwind project following the layout in Section 2, use the types from Section 3, populate mock data per Section 4, and comment every backend integration point per Section 5.
