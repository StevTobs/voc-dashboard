import { FiSearch } from 'react-icons/fi';
import type {
  DashboardFilters,
  FilterOptions,
  RegionKey,
} from '../../types/dashboard';
import { MultiSelectDropdown } from '../ui/MultiSelectDropdown';
import { RegionPills } from './RegionPills';

interface FilterBarProps {
  filters: DashboardFilters;
  filterOptions: FilterOptions;
  onChange: (filters: DashboardFilters) => void;
  onSearch: () => void;
}

export function FilterBar({
  filters,
  filterOptions,
  onChange,
  onSearch,
}: FilterBarProps) {
  return (
    <div className="rounded-lg border border-peaBorder bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-end gap-3">
        <MultiSelectDropdown
          label="สถานะ"
          options={filterOptions.status}
          selected={filters.status}
          onChange={(status) => onChange({ ...filters, status })}
        />
        <MultiSelectDropdown
          label="ปี"
          options={filterOptions.year}
          selected={filters.year}
          onChange={(year) => onChange({ ...filters, year })}
        />
        <MultiSelectDropdown
          label="ไตรมาส"
          options={filterOptions.quarter}
          selected={filters.quarter}
          onChange={(quarter) => onChange({ ...filters, quarter })}
        />
        <label className="flex flex-col gap-1 text-sm text-textBody">
          <span className="sr-only">กรองประเภทเสียง level 1</span>
          <select
            aria-label="กรองประเภทเสียง level 1"
            value={filters.voiceTypeLevel1}
            onChange={(e) =>
              onChange({ ...filters, voiceTypeLevel1: e.target.value })
            }
            className="min-w-[200px] rounded-md border border-peaBorder bg-white px-3 py-2 text-sm shadow-sm hover:border-headerBg"
          >
            {filterOptions.voiceTypeLevel1.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          aria-label="ค้นหา"
          onClick={onSearch}
          className="flex items-center gap-2 rounded-md bg-searchBtn px-5 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-110"
        >
          <FiSearch size={16} />
          ค้นหา
        </button>
      </div>
      <div className="mt-4">
        <RegionPills
          selected={filters.regions}
          onChange={(regions: RegionKey[]) => onChange({ ...filters, regions })}
        />
      </div>
    </div>
  );
}
