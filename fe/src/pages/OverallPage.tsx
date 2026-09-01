import { useEffect, useState } from 'react';
import { fetchDashboardOverview, fetchFilterOptions } from '../services/api';
import type {
  DashboardCharts,
  DashboardFilters,
  FilterOptions,
  KpiSummary,
} from '../types/dashboard';
import { formatThaiDateTime } from '../utils/formatThaiDate';
import { ChartsSection } from '../components/dashboard/ChartsSection';
import { DetailTable } from '../components/dashboard/DetailTable';
import { FilterBar } from '../components/dashboard/FilterBar';
import { KpiCards } from '../components/dashboard/KpiCards';

const DEFAULT_FILTERS: DashboardFilters = {
  status: ['all'],
  year: ['2568'],
  quarter: [],
  voiceTypeLevel1: 'all',
  regions: [],
};

export function OverallPage() {
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(
    null,
  );
  const [draftFilters, setDraftFilters] =
    useState<DashboardFilters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<DashboardFilters>(DEFAULT_FILTERS);
  const [kpi, setKpi] = useState<KpiSummary | null>(null);
  const [charts, setCharts] = useState<DashboardCharts | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFilterOptions().then(setFilterOptions);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchDashboardOverview(appliedFilters).then((response) => {
      setKpi(response.kpi);
      setCharts(response.charts);
      setIsLoading(false);
    });
  }, [appliedFilters]);

  function handleSearch() {
    setAppliedFilters(draftFilters);
    setHasSearched(true);
  }

  return (
    <div className="px-4 pb-10 pt-6 sm:px-6 md:px-6 md:pt-10">
      <div>
        {hasSearched ? (
          <div className="flex h-[50px] items-center rounded-xl bg-successBanner pl-6 text-sm font-medium text-textBody">
            ข้อมูลได้ทำการอัพเดทเรียบร้อยแล้ว
          </div>
        ) : (
          <h1 className="mb-2 text-2xl font-bold text-textBody sm:text-[30px]">
            PEA Complain Overall
          </h1>
        )}
        <p className="mb-6 mt-1.5 text-sm text-textBody/60">
          วันที่อัพเดทข้อมูลล่าสุด:{' '}
          {kpi ? formatThaiDateTime(kpi.lastUpdatedAt) : '-'}
        </p>
      </div>

      <div className="space-y-6">
        {filterOptions && (
          <FilterBar
            filters={draftFilters}
            filterOptions={filterOptions}
            onChange={setDraftFilters}
            onSearch={handleSearch}
          />
        )}

        {kpi && <KpiCards kpi={kpi} />}

        <DetailTable filters={appliedFilters} />

        {charts && <ChartsSection charts={charts} />}

        {isLoading && !kpi && (
          <p className="text-center text-sm text-textBody/50">
            กำลังโหลดข้อมูล...
          </p>
        )}
      </div>
    </div>
  );
}
