import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useDashboardData } from './DataProvider.jsx';
import { DEFAULT_FILTERS, OFFICE_FILTER, applyFilters, deriveFilterOptions, normalizeFilters } from './filters.js';

const FilterContext = createContext(null);

/** Single owner of the applied filters and the one filtered dataset every page consumes. */
export function FilterProvider({ children }) {
  const { records } = useDashboardData();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const options = useMemo(() => deriveFilterOptions(records), [records]);
  const filteredRecords = useMemo(() => applyFilters(records, filters), [records, filters]);
  // The complaint-detail page narrows the same dataset further by การไฟฟ้า.
  const detailRecords = useMemo(() => applyFilters(filteredRecords, filters, [OFFICE_FILTER]), [filteredRecords, filters]);
  const apply = useCallback(next => setFilters(normalizeFilters(next)), []);
  const reset = useCallback(() => setFilters(DEFAULT_FILTERS), []);
  const value = useMemo(() => ({ filters, options, filteredRecords, detailRecords, apply, reset }), [filters, options, filteredRecords, detailRecords, apply, reset]);
  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilters() {
  const value = useContext(FilterContext);
  if (!value) throw Error('useFilters requires FilterProvider');
  return value;
}
