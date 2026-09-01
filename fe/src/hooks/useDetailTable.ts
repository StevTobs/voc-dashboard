import { useEffect, useState } from 'react';
import { fetchDetailTable } from '../services/api';
import type { DashboardFilters, DetailTableResponse } from '../types/dashboard';

// Re-fetches whenever `filters` or `page` changes, matching the spec's
// requirement that pagination changes trigger a fresh table request.
export function useDetailTable(filters: DashboardFilters, page: number) {
  const [data, setData] = useState<DetailTableResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    fetchDetailTable(filters, page).then((response) => {
      if (!cancelled) {
        setData(response);
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page]);

  return { data, isLoading };
}
