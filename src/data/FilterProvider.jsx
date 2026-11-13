import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useDashboardData } from './DataProvider.jsx';
import { DEFAULT_FILTERS, OFFICE_FILTER, applyFilters, deriveFilterOptions, normalizeFilters } from './filters.js';
import { TEST_REGION } from './schema.js';

const FilterContext = createContext(null);

/** Single owner of the applied filters and the one filtered dataset every page consumes. */
export function FilterProvider({ children }) {
  const { records, testRecords } = useDashboardData();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  // System-test cases are offered as one extra พื้นที่ option (last); they never enter filteredRecords or any statistic.
  const options = useMemo(() => {
    const derived = deriveFilterOptions(records);
    return testRecords.length ? { ...derived, region: [...derived.region, { value: TEST_REGION, label: TEST_REGION }] } : derived;
  }, [records, testRecords]);
  // Listed (as a table) only when that area is picked; the other filters still narrow the list.
  const extraRecords = useMemo(() => filters.region.includes(TEST_REGION) ? applyFilters(testRecords, filters) : [], [testRecords, filters]);
  const filteredRecords = useMemo(() => applyFilters(records, filters), [records, filters]);
  // The complaint-detail page narrows the same dataset further by การไฟฟ้า.
  const detailRecords = useMemo(() => applyFilters(filteredRecords, filters, [OFFICE_FILTER]), [filteredRecords, filters]);
  const apply = useCallback(next => setFilters(normalizeFilters(next)), []);
  const reset = useCallback(() => setFilters(DEFAULT_FILTERS), []);
  const value = useMemo(() => ({ filters, options, filteredRecords, detailRecords, extraRecords, apply, reset }), [filters, options, filteredRecords, detailRecords, extraRecords, apply, reset]);
  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilters() {
  const value = useContext(FilterContext);
  if (!value) throw Error('useFilters requires FilterProvider');
  return value;
}
