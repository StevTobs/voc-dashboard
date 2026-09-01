import type { ReactNode } from 'react';
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
    <div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <FilterField label="สถานะ">
          <MultiSelectDropdown
            label="สถานะ"
            options={filterOptions.status}
            selected={filters.status}
            onChange={(status) => onChange({ ...filters, status })}
          />
        </FilterField>
        <FilterField label="ปี">
          <MultiSelectDropdown
            label="ปี"
            options={filterOptions.year}
            selected={filters.year}
            onChange={(year) => onChange({ ...filters, year })}
          />
        </FilterField>
        <FilterField label="ไตรมาส">
          <MultiSelectDropdown
            label="ไตรมาส"
            options={filterOptions.quarter}
            selected={filters.quarter}
            onChange={(quarter) => onChange({ ...filters, quarter })}
          />
        </FilterField>
        <FilterField label="กรองประเภทเสียง level 1">
          <select
            aria-label="กรองประเภทเสียง level 1"
            value={filters.voiceTypeLevel1}
            onChange={(e) =>
              onChange({ ...filters, voiceTypeLevel1: e.target.value })
            }
            className="h-[38px] min-w-[180px] rounded-md border border-peaBorder bg-white px-3 text-sm text-textBody shadow-sm hover:border-headerBg"
          >
            {filterOptions.voiceTypeLevel1.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FilterField>
        <button
          type="button"
          aria-label="ค้นหา"
          onClick={onSearch}
          className="ml-auto flex h-[38px] items-center gap-1.5 rounded-md bg-searchBtn px-4 text-sm font-semibold text-white shadow-sm hover:brightness-110"
        >
          <FiSearch size={16} />
          ค้นหา
        </button>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <span className="text-sm text-textBody/80">พื้นที่:</span>
        <RegionPills
          selected={filters.regions}
          onChange={(regions: RegionKey[]) => onChange({ ...filters, regions })}
        />
      </div>
    </div>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-textBody/80">{label}</span>
      {children}
    </div>
  );
}
