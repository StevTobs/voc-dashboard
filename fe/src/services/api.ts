import {
  mockCurrentUser,
  mockDashboardCharts,
  mockDetailTableRows,
  mockFilterOptions,
  mockKpiSummary,
} from '../mocks/dashboardMock';
import type {
  CurrentUser,
  DashboardFilters,
  DashboardOverviewResponse,
  DetailTableResponse,
  FilterOptions,
} from '../types/dashboard';

const DEFAULT_PAGE_SIZE = 5;
const MOCK_LATENCY_MS = 150;

function delay<T>(value: T, ms = MOCK_LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

// TODO: BACKEND INTEGRATION POINT
// GET /api/dashboard/filter-options
// Currently using mockFilterOptions instead
export function fetchFilterOptions(): Promise<FilterOptions> {
  return delay(mockFilterOptions);
}

// TODO: BACKEND INTEGRATION POINT
// GET /api/dashboard/overview?status=&year=&quarter=&voiceTypeLevel1=&regions=
// Currently using mockKpiSummary + mockDashboardCharts instead
export function fetchDashboardOverview(
  filters: DashboardFilters,
): Promise<DashboardOverviewResponse> {
  return delay({
    kpi: mockKpiSummary,
    table: buildTablePage(1, DEFAULT_PAGE_SIZE),
    charts: mockDashboardCharts,
    appliedFilters: filters,
  });
}

// TODO: BACKEND INTEGRATION POINT
// GET /api/dashboard/table?status=&year=&quarter=&voiceTypeLevel1=&regions=&page=
// Currently using mockDetailTableRows instead
export function fetchDetailTable(
  filters: DashboardFilters,
  page: number,
  pageSize: number = DEFAULT_PAGE_SIZE,
): Promise<DetailTableResponse> {
  void filters; // will be forwarded to the backend once wired up
  return delay(buildTablePage(page, pageSize));
}

// TODO: BACKEND INTEGRATION POINT
// GET /api/auth/me
// Currently using mockCurrentUser instead
export function fetchCurrentUser(): Promise<CurrentUser> {
  return delay(mockCurrentUser);
}

function buildTablePage(page: number, pageSize: number): DetailTableResponse {
  const start = (page - 1) * pageSize;
  const rows = mockDetailTableRows.slice(start, start + pageSize);
  return {
    rows,
    pagination: {
      currentPage: page,
      pageSize,
      totalItems: mockDetailTableRows.length,
    },
  };
}
