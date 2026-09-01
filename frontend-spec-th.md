# Prompt สำหรับสร้าง Frontend: PEA VOC Dashboard
> ไฟล์นี้ใช้เป็น prompt วางให้ Claude (ใน VS Code / Claude Code) สร้าง frontend ก่อน โดยใช้ mock data ไปพลางๆ แล้วเว้น "จุดเชื่อมต่อ" (integration point) ไว้ให้เสียบ backend จริงทีหลัง

---

## 1. ภาพรวมโปรเจกต์

สร้างหน้าเว็บแดชบอร์ด **"PEA VOC Dashboard"** (Voice of Customer) สำหรับการไฟฟ้าส่วนภูมิภาค (PEA) แสดงสถิติเรื่องร้องเรียน/แจ้งเหตุจากลูกค้า มีทั้งหมด 4 หน้า (เมนูซ้าย) แต่ให้เริ่มสร้างหน้าแรกก่อน คือ **"PEA Complaint 2568 Overall"**

**Tech stack ที่แนะนำ:** React + TypeScript + Vite, ใช้ Tailwind CSS สำหรับ styling, ใช้ Recharts หรือ Chart.js สำหรับกราฟ, ใช้ React Query หรือ SWR สำหรับจุดเชื่อมต่อ API ในอนาคต (ตอนนี้ให้ mock ด้วย local JSON/state ไปก่อน)

**ธีมสี:** โทนเขียว/ฟ้า minty (คล้าย Esri) — header เขียวเข้ม, sidebar เขียวมิ้นต์, การ์ด KPI ใช้สีพาสเทล (ฟ้าอ่อน, เขียวอ่อน, ม่วงอ่อน), กราฟแท่งสีน้ำตาลอมชมพู (dusty rose)

**ภาษา UI:** ภาษาไทยทั้งหมด (ตัวหนังสือในตัวอย่าง), รองรับฟอนต์ไทย (เช่น Noto Sans Thai / Sarabun)

---

## 2. โครงสร้างหน้าจอ (Layout)

1. **Header (บนสุด)**
   - โลโก้ esri + ชื่อระบบ "PEA VOC Dashboard"
   - มุมขวา: avatar ผู้ใช้ + "Username : {username}"

2. **Sidebar (ซ้าย)**
   - เมนู 4 รายการ (มี icon):
     - PEA Complaint 2568 Overall (active)
     - PEA Complaint 2568 Quality
     - PEA Complaint 2568 Service
     - PEA Complaint 2568 Corruption
   - ปุ่ม "ออกจากระบบ" ด้านล่างสุด

3. **หัวข้อหน้า**
   - หัวข้อ: "PEA Complain Overall"
   - หรือหลังกดค้นหา (search) จะเปลี่ยนเป็นแบนเนอร์สีเขียวอ่อน: "ข้อมูลได้ทำการอัพเดทเรียบร้อยแล้ว"
   - บรรทัด: "วันที่อัพเดทข้อมูลล่าสุด: {last_updated_display}"

4. **แถบตัวกรอง (Filter Bar)**
   - Dropdown: สถานะ, ปี, ไตรมาส, กรองประเภทเสียง (level 1)
   - ปุ่ม "ค้นหา" (สีน้ำเงิน)
   - แถวปุ่มพื้นที่ (pill/toggle buttons, เลือกได้หลายอัน หรืออันเดียว — ให้ระบุ multi-select): สำนักงานใหญ่, ภาคเหนือ, ภาคตะวันออกเฉียงเหนือ, ภาคกลาง, ภาคใต้

5. **การ์ด KPI (2 แถว, แถวละ 3 การ์ด)**
   - แถว 1: จำนวนคำร้องเรียนทั้งหมด (การ์ดใหญ่สีฟ้า), ภาคเหนือ, ภาคตะวันออกเฉียงเหนือ (สีเขียวอ่อน)
   - แถว 2: สำนักงานใหญ่ (สีม่วง), ภาคกลาง, ภาคใต้ (สีเขียวอ่อน)
   - แถวตัวเลขสถานะ (ไม่มีกรอบการ์ด แค่ตัวเลขใหญ่ + label): จำนวนเรื่องดำเนินการอยู่, จำนวนเรื่องที่ปิด, จำนวนเรื่องที่ยกเลิก

6. **ส่วน "รายการรายละเอียด"** (มี icon ขยาย/zoom)
   - ตารางข้อมูล (แสดงเมื่อกด expand หรือแสดงตลอดก็ได้ — ให้ทำ toggle) คอลัมน์:
     - ชื่อหน่วยงาน, ระยะเวลา (วัน), หมายเลขผู้ใช้ไฟ, ประเภทเรื่องแจ้ง, ประเภทเสียงของลูกค้า, หมายเลขเคส
   - Pagination ด้านล่างขวา: "1 - 5 of {total} items" + ปุ่ม "ก่อนหน้า" / "ถัดไป"

7. **กราฟ 7 ชุด** (แท่งแนวนอน ทั้งหมด, สีน้ำตาลอมชมพู, มี tooltip แสดงค่าตอน hover)
   - ประเภทของเสียง level 1 (แกน x ถึง ~20k)
   - ประเด็น (Level 3) — มี scrollbar ด้านขวา (แสดงบางส่วน เลื่อนดูเพิ่มได้), แกน x ถึง ~50
   - หัวข้อ Level 2 (แกน x ถึง ~50)
   - ประเด็นย่อย (Level 4) — มี scrollbar, แกน x ถึง ~50
   - ช่องทางการแจ้ง (แกน x ถึง ~400k)
   - จำนวนการไฟฟ้าที่มีเสียงสูงสุด — มี scrollbar, แกน x ถึง ~2
   - เขตพื้นที่ (แกน x ถึง ~200k)

---

## 3. Data Contract / ตัวแปรที่ frontend ต้องรอเชื่อมกับ backend

> ให้สร้าง TypeScript interfaces เหล่านี้ในไฟล์ `src/types/dashboard.ts` แล้วสร้าง mock data ที่ตรงกับ interface ไว้ใน `src/mocks/dashboardMock.ts` เพื่อใช้ก่อนต่อ backend จริง จากนั้นสร้าง service layer เปล่าๆ ใน `src/services/api.ts` ที่ยังไม่ต่อ endpoint จริง (comment `// TODO: connect backend`) แต่คืนค่าตาม interface เดียวกัน

### 3.1 ตัวกรอง (Filters)
```ts
interface DashboardFilters {
  status: string[];        // ตัวเลือก: "all" | "in_progress" | "closed" | "cancelled"
  year: string[];          // เช่น ["2568"], รองรับเลือกหลายปี
  quarter: string[];       // เช่น ["1","2","3","4"]
  voiceTypeLevel1: string; // ค่าจาก dropdown "กรองประเภทเสียง (level 1)"
  regions: string[];       // เลือกได้หลายพื้นที่: "hq" | "north" | "northeast" | "central" | "south"
}
```
**หน้าที่ frontend:** เก็บ state ของตัวกรอง, ส่ง `DashboardFilters` ไปเรียก backend ตอนกดปุ่ม "ค้นหา"
**รอ backend:** endpoint สำหรับดึงตัวเลือก dropdown (options list) ของแต่ละ filter, และ endpoint สำหรับ submit filter แล้วคืนข้อมูลใหม่ทั้งหมด (KPI + ตาราง + กราฟ)

### 3.2 สรุปตัวเลข (KPI Summary)
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
  lastUpdatedAt: string; // ISO datetime string เช่น "2026-08-03T10:00:00+07:00"
}
```
**หมายเหตุ:** `lastUpdatedAt` ต้อง format เป็นข้อความไทยแบบ "วันจันทร์ที่ 3 สค. 69 เวลา 10.00 น." ที่ frontend เอง (เขียนฟังก์ชัน formatter แยก ไม่ต้องรอ backend format ให้)

### 3.3 แถวตารางรายละเอียด (Detail Table)
```ts
interface DetailTableRow {
  orgName: string;           // ชื่อหน่วยงาน เช่น "กฟจ.เชียงใหม่"
  durationDays: number;      // ระยะเวลา (วัน)
  meterNumber: string;       // หมายเลขผู้ใช้ไฟ
  complaintType: string;     // ประเภทเรื่องแจ้ง เช่น "ร้องขอ", "ร้องเรียน"
  customerVoiceType: string; // ประเภทเสียงของลูกค้า
  caseNumber: string;        // หมายเลขเคส เช่น "A123456789"
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
**หน้าที่ frontend:** เรียก backend ใหม่ทุกครั้งที่เปลี่ยนหน้า pagination (`currentPage`) — ให้ทำ hook `useDetailTable(filters, page)` เตรียมไว้

### 3.4 ข้อมูลกราฟ (Charts)
```ts
interface ChartDataPoint {
  label: string;
  value: number;
}

interface DashboardCharts {
  voiceTypeLevel1: ChartDataPoint[];   // ประเภทของเสียง level 1
  topicLevel2: ChartDataPoint[];       // หัวข้อ Level 2
  issueLevel3: ChartDataPoint[];       // ประเด็น (Level 3)
  subIssueLevel4: ChartDataPoint[];    // ประเด็นย่อย (Level 4)
  channel: ChartDataPoint[];           // ช่องทางการแจ้ง
  topElectricOffices: ChartDataPoint[];// จำนวนการไฟฟ้าที่มีเสียงสูงสุด
  regionZone: ChartDataPoint[];        // เขตพื้นที่
}
```
**หน้าที่ frontend:** render bar chart แนวนอนจาก `ChartDataPoint[]`, ทำ tooltip แสดง `"{label}: {value}"` ตอน hover/tap แต่ละแท่ง (ดูตัวอย่างจากภาพ: "ข้อเสนอแนะ/ข้อคิดเห็น: 18k", "ปลอมแปลงใบเรียกชำระเงินของกฟภ.: 20", "PEA - Email: 20")
สำหรับกราฟที่มีรายการยาว (ประเด็น Level 3, ประเด็นย่อย Level 4, จำนวนการไฟฟ้าที่มีเสียงสูงสุด) ให้ทำ container สูงคงที่ + scroll แนวตั้งภายใน

### 3.5 ผู้ใช้งาน (User)
```ts
interface CurrentUser {
  username: string; // แสดงที่มุมขวาบน "Username : {username}"
}
```

### 3.6 Response รวมของ API หลัก (เสนอไว้เผื่อ backend ทำเป็น endpoint เดียว)
```ts
interface DashboardOverviewResponse {
  kpi: KpiSummary;
  table: DetailTableResponse;
  charts: DashboardCharts;
  appliedFilters: DashboardFilters;
}
```

---

## 4. สิ่งที่ต้องทำใน mock data

- สร้างไฟล์ `src/mocks/dashboardMock.ts` ที่มีค่า mock ตรงกับตัวเลขในตัวอย่าง (เช่น totalComplaints = 1000000, regionNorth = 5000 เป็นต้น) เพื่อให้ UI หน้าตาตรงกับภาพตัวอย่างทันทีที่รันโปรเจกต์
- ทำ mock อย่างน้อย 40 แถวสำหรับตาราง (ให้ pagination แสดง "1 - 5 of 40 items" ได้จริง)
- Filter dropdown options ให้ mock ไว้ก่อน (เช่น ปี: 2568, 2567, 2566 / สถานะ: ทั้งหมด, ปิด, รอดำเนินการ)

## 5. จุดที่ต้อง comment ไว้ชัดเจนว่า "รอเชื่อม backend"

ในทุกจุดที่เรียก mock data ให้ใส่ comment แบบนี้กำกับไว้เพื่อให้แทนที่ง่ายภายหลัง:
```ts
// TODO: BACKEND INTEGRATION POINT
// GET /api/dashboard/overview?status=&year=&quarter=&voiceTypeLevel1=&regions=
// GET /api/dashboard/table?...&page=
// ตอนนี้ใช้ mockDashboardData แทน
```

## 6. Responsive & Accessibility
- ให้ทำ responsive สำหรับจอ desktop เป็นหลัก (ตามภาพตัวอย่าง) แต่ปรับ sidebar ให้ยุบเป็นเมนู hamburger บนจอมือถือ
- ปุ่ม/dropdown ทุกอันต้องมี label ที่อ่านได้ (aria-label)

## 7. Color Palette (โทนสี)

> สีโดยประมาณจากภาพตัวอย่าง ให้ปรับ fine-tune ได้ตอนทำจริง

| ส่วนของ UI | คำอธิบาย | Hex Code |
|---|---|---|
| Header background (แถบบนสุด) | เขียวเทียลเข้ม | `#2E9B8F` |
| Sidebar background | เขียวมิ้นต์อ่อน | `#D6F0E8` |
| Sidebar menu item active (ตัวหนังสือ) | เขียวเทียลเข้ม | `#1F6E63` |
| พื้นหลังหน้าเว็บหลัก | ขาว/เทาอ่อนมาก | `#F7FAFA` |
| การ์ด KPI "จำนวนคำร้องเรียนทั้งหมด" | ฟ้าอ่อน (cyan pastel) | `#7FE0EA` |
| การ์ด KPI ภาคเหนือ/ภาคตะวันออกเฉียงเหนือ/ภาคกลาง/ภาคใต้ | เขียวพาสเทล | `#C9EFA0` |
| การ์ด KPI สำนักงานใหญ่ | ม่วงพาสเทล | `#D9C7F0` |
| ปุ่มพื้นที่ (region pill) — active | ฟ้าสด | `#4FA8E8` |
| ปุ่มพื้นที่ (region pill) — ตัวหนังสือ | ขาว | `#FFFFFF` |
| ปุ่ม "ค้นหา" | น้ำเงิน | `#2563EB` |
| แท่งกราฟ (bar chart) | น้ำตาลอมชมพู (dusty rose) | `#BFA6A0` |
| Tooltip กราฟ (พื้นหลัง) | เขียวมิ้นต์อมฟ้า | `#8FD9CE` |
| แบนเนอร์สำเร็จ "ข้อมูลได้ทำการอัพเดทเรียบร้อยแล้ว" | เขียวอ่อน | `#D9F2C4` |
| ตัวหนังสือหลัก (body text) | เทาเข้ม | `#333333` |
| เส้นขอบ/เส้นแบ่ง (border, grid line) | เทาอ่อน | `#E2E8E8` |
| Avatar badge (วงกลมผู้ใช้) | ชมพูสด | `#EC4899` |

**CSS variables พร้อมใช้:**
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

**ให้ Claude ทำ:** ใส่ตัวแปรสีเหล่านี้ในไฟล์ `tailwind.config.js` (ภายใต้ `theme.extend.colors`) โดยใช้ชื่อ key ตรงกับตัวแปรข้างต้น (ตัด prefix `--pea-` และเปลี่ยนเป็น camelCase เช่น `headerBg`, `sidebarBg`, `kpiCyan` เป็นต้น) เพื่อให้เรียกใช้ผ่าน class เช่น `bg-headerBg` ได้ทันที

## 8. Layout แบบละเอียด (Pixel-Exact Spec)

> ⚠️ **สำคัญ:** เพื่อให้ได้ layout ที่ตรงกับภาพต้นฉบับ "เป๊ะๆ" จริงๆ ให้แนบไฟล์ภาพตัวอย่าง (screenshot ต้นฉบับ p1.png–p9.png) ไปพร้อม prompt นี้ด้วยทุกครั้งที่สั่ง Claude Code เพราะสเปกตัวเลขด้านล่างเป็นค่าประมาณจากการวัดสัดส่วนในภาพ ส่วนสี เงา และรายละเอียดปลีกย่อยอื่นๆ ต้องให้ Claude "ดูภาพจริง" เทียบเคียงไปด้วยเสมอถึงจะแม่นยำที่สุด — ให้สั่ง Claude ว่า **"ให้ยึดภาพอ้างอิงเป็นหลัก ถ้าตัวเลขในสเปกกับภาพขัดกัน ให้เชื่อภาพ"**

### 8.1 ขนาดอ้างอิง (Reference canvas)
- ออกแบบบน container กว้างสูงสุด (max-width) = **1200px** จัดกึ่งกลางหน้าจอ, พื้นหลังนอก container = `#F7FAFA`
- ความสูงทั้งหน้าประมาณ 2400px (หน้ายาว scroll ได้)

### 8.2 ASCII Wireframe
```
┌──────────────────────────────────────────────────────────────────┐
│ [esri]  PEA VOC Dashboard                    (avatar) Username:.. │ ← Header 90px
├───────────┬──────────────────────────────────────────────────────┤
│           │ PEA Complain Overall                                 │
│  Sidebar  │ วันที่อัพเดทข้อมูลล่าสุด: ...                          │
│  155px    │ [สถานะ▾][ปี▾][ไตรมาส▾][กรองประเภทเสียง▾]    [ค้นหา]   │
│           │ พื้นที่: (pill)(pill)(pill)(pill)(pill)               │
│ • Overall │ ┌──────────────────────────────────────────────────┐ │
│ • Quality │ │  [รวมทั้งหมด]   [เหนือ]   [ตอ.นอ.เหนือ]           │ │
│ • Service │ │  [สนง.ใหญ่]     [กลาง]    [ใต้]                   │ │
│ • Corrupt │ │  ดำเนินการอยู่    ปิด      ยกเลิก                 │ │
│           │ └──────────────────────────────────────────────────┘ │
│           │ รายการรายละเอียด ⊕                                   │
│           │ ┌──────────────────────────────────────────────────┐ │
│           │ │ [ตาราง 6 คอลัมน์ × 5 แถว + pagination]             │ │
│           │ └──────────────────────────────────────────────────┘ │
│           │ ┌──────────────────────────────────────────────────┐ │
│           │ │ [Lv1 bar chart]      [Lv3 bar chart + scrollbar]  │ │
│           │ │ [Lv2 bar chart]      [Lv4 bar chart + scrollbar]  │ │
│           │ │ [ช่องทางการแจ้ง — bar chart เต็มความกว้าง]         │ │
│           │ └──────────────────────────────────────────────────┘ │
│           │ ┌──────────────────────────────────────────────────┐ │
│ ⟲ Logout  │ │ [การไฟฟ้าเสียงสูงสุด + scrollbar] [เขตพื้นที่]     │ │
│           │ └──────────────────────────────────────────────────┘ │
└───────────┴──────────────────────────────────────────────────────┘
```

### 8.3 Header
| Element | ค่า |
|---|---|
| ความสูง | 90px, กว้างเต็มจอ, ตำแหน่ง `fixed`/`sticky` top |
| Background | `--pea-header-bg` |
| Logo box | สี่เหลี่ยมดำ 40×40px มุมโค้ง 6px, ข้อความ "esri" สีขาวตรงกลาง, margin-left 24px |
| Title "PEA VOC Dashboard" | ต่อจากโลโก้ 16px, font-size 26px, font-weight 700, สีขาว |
| Avatar (วงกลม) | เส้นผ่านศูนย์กลาง 56px, ชิดขวา margin-right 220px จากขอบขวาสุด, พื้นหลังวงกลมขาว มีภาพการ์ตูนข้างใน |
| "Username : {username}" | ถัดจาก avatar 12px, font-size 16px, สีขาว, margin-right 24px จากขอบขวาสุด |

### 8.4 Sidebar
| Element | ค่า |
|---|---|
| ความกว้าง | 155px คงที่ (fixed), เต็มความสูงหน้าจอ ต่อจาก header |
| Background | `--pea-sidebar-bg` |
| Padding บน | 40px ก่อนเมนูแรก |
| แต่ละเมนู | สูงประมาณ 70px ต่อรายการ, icon ขนาด 20×20px ชิดซ้าย margin-left 20px, ข้อความ 2 บรรทัด font-size 14px ต่อจาก icon 10px |
| สถานะ active (รายการแรก) | ตัวหนังสือสีเข้มขึ้น/หนาขึ้น (ใช้ `--pea-sidebar-active-text`), ไม่มี background highlight |
| "ออกจากระบบ" | ชิดล่างสุดของ sidebar, margin-bottom 30px, มี icon ลูกศรวนซ้าย + ข้อความ |

### 8.5 พื้นที่เนื้อหาหลัก (Main content)
| Element | ค่า |
|---|---|
| margin-left | 155px (ความกว้าง sidebar) + gutter |
| padding | บน 40px, ซ้าย-ขวา 24px |
| ความกว้างใช้งานจริง | ~980–1000px |

### 8.6 หัวข้อหน้า + ตัวกรอง
| Element | ค่า |
|---|---|
| หัวข้อ "PEA Complain Overall" | font-size 30px, font-weight 700, สี `--pea-text-body`, margin-bottom 8px |
| แบนเนอร์สำเร็จ (แทนหัวข้อหลังกด "ค้นหา") | เต็มความกว้าง content, สูง ~50px, background `--pea-success-banner`, มุมโค้ง 12px, ข้อความกึ่งกลางแนวตั้ง padding-left 24px |
| บรรทัดวันที่อัพเดท | font-size 14px, สีเทา, margin-top 6px, margin-bottom 24px |
| แถวตัวกรอง (dropdown) | จัดเรียงแนวนอน `flex`, gap ระหว่างช่อง 20px, แต่ละ dropdown สูง 38px มุมโค้ง 6px เส้นขอบบาง 1px `--pea-border`, ป้ายชื่อ (label) อยู่ซ้ายของกล่องแบบ inline font-size 14px |
| ปุ่ม "ค้นหา" | ชิดขวาสุดของแถว, กว้าง ~72px สูง 38px, background `--pea-search-btn`, ตัวอักษรขาว มุมโค้ง 6px |
| แถว "พื้นที่:" (region pills) | margin-top 16px, label ซ้ายสุด แล้วตามด้วย pill 5 อัน gap 10px, แต่ละ pill สูง 34px padding แนวนอน 18px มุมโค้งเต็ม (border-radius 999px), background `--pea-pill-active`, ตัวอักษรขาว font-size 14px font-weight 600 |

### 8.7 กล่อง KPI (Card panel)
| Element | ค่า |
|---|---|
| Container | margin-top 24px, background ขาว, มุมโค้ง 24px, padding 40px, มี box-shadow เบาๆ (`0 2px 12px rgba(0,0,0,0.05)`) |
| Grid แถว 1 และ 2 | 3 คอลัมน์เท่ากัน (`grid-template-columns: repeat(3, 1fr)`), gap แนวนอน 24px, gap แนวตั้งระหว่างแถว 40px |
| แต่ละ "คอลัมน์" | label อยู่บน (font-size 16px font-weight 600 สีเข้ม) กึ่งกลาง margin-bottom 12px, การ์ดตัวเลขอยู่ล่าง |
| การ์ดตัวเลข (pill) | กว้าง ~280px สูง ~110px (การ์ดใหญ่กลาง "รวมทั้งหมด"/"สนง.ใหญ่") หรือ ~90px (การ์ดภาค), มุมโค้งเต็ม (border-radius = ครึ่งความสูง), จัดกึ่งกลางในคอลัมน์, ตัวเลขข้างในกึ่งกลางแนวตั้งแนวนอน font-size 42px (การ์ดใหญ่) / 34px (การ์ดภาค) font-weight 700 |
| สีการ์ด | รวมทั้งหมด = `--pea-kpi-cyan`, สนง.ใหญ่ = `--pea-kpi-purple`, ที่เหลือ = `--pea-kpi-green` |
| แถว 3 (ตัวเลขสถานะ ไม่มีการ์ด) | margin-top 32px, 3 คอลัมน์เท่ากันเหมือนเดิมแต่ไม่มี background, label บน font-size 16px, ตัวเลขล่าง font-size 26px font-weight 700, จัดกึ่งกลางแต่ละคอลัมน์ |

### 8.8 รายการรายละเอียด + ตาราง
| Element | ค่า |
|---|---|
| หัวข้อ "รายการรายละเอียด ⊕" | margin-top 24px margin-bottom 16px, font-size 18px font-weight 700, icon ขยาย (⊕) ต่อท้ายข้อความ 8px คลิกได้ (toggle table) |
| Container ตาราง | background ขาว มุมโค้ง 20px padding 24px |
| Header แถวตาราง | font-weight 600 font-size 14px สีเทาเข้ม, มี border-bottom 1px `--pea-border`, padding แนวตั้ง 14px |
| คอลัมน์ (สัดส่วนความกว้างโดยประมาณจาก 100%) | ชื่อหน่วยงาน 15% / ระยะเวลา (วัน) 12% / หมายเลขผู้ใช้ไฟ 16% / ประเภทเรื่องแจ้ง 14% / ประเภทเสียงขอลูกค้า 30% / หมายเลขเคส 13% |
| แถวข้อมูล | สูงแถวละ ~56px, border-bottom 1px `--pea-border`, font-size 14px |
| Pagination footer | ชิดขวา margin-top 16px, ข้อความ "1 - 5 of {total} items" ตามด้วยปุ่ม "ก่อนหน้า" / "ถัดไป" (ข้อความล้วน ไม่มีกรอบปุ่ม) font-size 14px สีเทา, ปุ่มที่กดได้เปลี่ยนสีเป็น `--pea-search-btn` |

### 8.9 กราฟ (Charts container)
| Element | ค่า |
|---|---|
| Container | margin-top 24px, background ขาว มุมโค้ง 20px padding 40px |
| Grid แถว 1 และ 2 | 2 คอลัมน์เท่ากัน gap แนวนอน 60px gap แนวตั้ง 48px |
| หัวข้อกราฟย่อย | กึ่งกลางด้านบนกราฟ font-size 16px font-weight 700 margin-bottom 16px |
| กราฟแท่งแนวนอน (ทั่วไป) | ความสูงพอดีกับจำนวนแท่ง (แต่ละแท่งสูง ~26px + gap 14px), แท่งสี `--pea-chart-bar`, มุมโค้งขวาเล็กน้อย (4px), label ประเภทอยู่ซ้ายกราฟ font-size 13px, axis line ด้านล่างพร้อมตัวเลข min/max |
| กราฟที่มี scrollbar (ประเด็น Lv3, ประเด็นย่อย Lv4, การไฟฟ้าเสียงสูงสุด) | container สูงคงที่ ~260px, `overflow-y: auto`, scrollbar แสดงเป็นแท่งบางสีเทาด้านขวา (6px) |
| Tooltip เวลา hover แท่งกราฟ | กล่องพื้นหลัง `--pea-tooltip-bg` มุมโค้ง 6px padding 6px 10px, ข้อความรูปแบบ `"{label}: {value}"` font-size 12px, มีลูกศรชี้ (triangle) ลงมาที่แท่งกราฟ |
| แถว 3 (ช่องทางการแจ้ง) | เต็มความกว้าง container, ความสูง ~420px แสดง 10 แท่ง, axis 0 ถึง 400k มี gridline ที่ 200k |
| Panel ล่างสุด (แยก container อีกกล่อง) | margin-top 24px, background ขาว มุมโค้ง 20px padding 40px, grid 2 คอลัมน์ gap 60px: "จำนวนการไฟฟ้าที่มีเสียงสูงสุด" (มี scrollbar) ซ้าย / "เขตพื้นที่" ขวา |

### 8.10 ระยะห่างระหว่าง section หลัก
ทุก container หลัก (KPI panel, ตาราง/รายการรายละเอียด, กราฟหลัก, กราฟล่างสุด) ให้เว้น margin-top/ระยะห่างแนวตั้งเท่ากัน = **24px**

---

**สรุปสำหรับ Claude:** ให้อ่าน spec ทั้งหมดข้างต้น แล้ว scaffold โปรเจกต์ React+TS+Tailwind ตามโครงสร้างข้อ 2, ใช้ type ตามข้อ 3, ใส่ mock data ตามข้อ 4, และ comment จุดเชื่อมต่อ backend ตามข้อ 5 ให้ครบทุกจุด
