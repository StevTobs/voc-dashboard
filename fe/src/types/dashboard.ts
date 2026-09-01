export type StatusFilter = 'all' | 'in_progress' | 'closed' | 'cancelled';

export type RegionKey = 'hq' | 'north' | 'northeast' | 'central' | 'south';

export interface DashboardFilters {
  status: string[]; // "all" | "in_progress" | "closed" | "cancelled"
  year: string[]; // e.g. ["2568"], supports multi-select
  quarter: string[]; // e.g. ["1","2","3","4"]
  voiceTypeLevel1: string; // value from the "voice type filter level 1" dropdown
  regions: RegionKey[]; // multi-select
}

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterOptions {
  status: FilterOption[];
  year: FilterOption[];
  quarter: FilterOption[];
  voiceTypeLevel1: FilterOption[];
}

export interface KpiSummary {
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

export interface DetailTableRow {
  orgName: string; // organization name, e.g. "กฟจ.เชียงใหม่"
  durationDays: number; // duration in days
  meterNumber: string; // meter/account number
  complaintType: string; // complaint type, e.g. "Request", "Complaint"
  customerVoiceType: string; // customer voice type
  caseNumber: string; // case number, e.g. "A123456789"
}

export interface DetailTablePagination {
  currentPage: number;
  pageSize: number; // default = 5
  totalItems: number;
}

export interface DetailTableResponse {
  rows: DetailTableRow[];
  pagination: DetailTablePagination;
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface DashboardCharts {
  voiceTypeLevel1: ChartDataPoint[]; // Voice type level 1
  topicLevel2: ChartDataPoint[]; // Topic level 2
  issueLevel3: ChartDataPoint[]; // Issue level 3
  subIssueLevel4: ChartDataPoint[]; // Sub-issue level 4
  channel: ChartDataPoint[]; // Reporting channel
  topElectricOffices: ChartDataPoint[]; // Top electric offices by complaint volume
  regionZone: ChartDataPoint[]; // Region zone
}

export interface CurrentUser {
  username: string; // shown top-right as "Username : {username}"
}

export interface DashboardOverviewResponse {
  kpi: KpiSummary;
  table: DetailTableResponse;
  charts: DashboardCharts;
  appliedFilters: DashboardFilters;
}
