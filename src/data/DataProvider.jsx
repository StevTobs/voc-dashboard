import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { loadComplaints } from './loader.js';
import { buildDataModel } from './aggregations.js';

const DataContext = createContext(null);
const EMPTY_RECORDS = Object.freeze([]);
/** VITE_DATA_URL points at the database buffer (e.g. /api/complaints.csv); otherwise the bundled mock CSV is used. */
export const DATA_URL = import.meta.env.VITE_DATA_URL || `${import.meta.env.BASE_URL}data/complaints.csv`;
export const USES_BUFFER = Boolean(import.meta.env.VITE_DATA_URL);

export function DataProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', records: EMPTY_RECORDS, issues: [], error: null });
  const [version, setVersion] = useState(0);
  // Re-fetch in place (keeping the current data on screen) when the buffer publishes a new snapshot.
  const reload = useCallback(() => setVersion(current => current + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    loadComplaints({ url: DATA_URL, signal: controller.signal })
      .then(result => { if (!controller.signal.aborted) setState({ ...result, status: 'ready', error: null }); })
      .catch(error => { if (!controller.signal.aborted) setState({ status: 'error', records: EMPTY_RECORDS, issues: [], error: error.message }); });
    return () => controller.abort();
  }, [version]);
  const model = useMemo(() => buildDataModel(state.records), [state.records]);
  const value = useMemo(() => ({ ...state, model, reload }), [state, model, reload]);
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useDashboardData() {
  const data = useContext(DataContext);
  if (!data) throw Error('useDashboardData requires DataProvider');
  return data;
}
