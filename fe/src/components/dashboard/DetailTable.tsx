import { useEffect, useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiMinusCircle, FiPlusCircle } from 'react-icons/fi';
import { useDetailTable } from '../../hooks/useDetailTable';
import type { DashboardFilters } from '../../types/dashboard';

const COLUMNS = [
  { key: 'orgName', label: 'ชื่อหน่วยงาน', width: '15%' },
  { key: 'durationDays', label: 'ระยะเวลา (วัน)', width: '12%' },
  { key: 'meterNumber', label: 'หมายเลขผู้ใช้ไฟ', width: '16%' },
  { key: 'complaintType', label: 'ประเภทเรื่องแจ้ง', width: '14%' },
  { key: 'customerVoiceType', label: 'ประเภทเสียงของลูกค้า', width: '30%' },
  { key: 'caseNumber', label: 'หมายเลขเคส', width: '13%' },
] as const;

interface DetailTableProps {
  filters: DashboardFilters;
}

export function DetailTable({ filters }: DetailTableProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [page, setPage] = useState(1);
  const { data } = useDetailTable(filters, page);

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const totalItems = data?.pagination.totalItems ?? 0;
  const pageSize = data?.pagination.pageSize ?? 5;
  const rangeStart = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalItems);
  const totalPages = Math.max(Math.ceil(totalItems / pageSize), 1);

  return (
    <div>
      <button
        type="button"
        aria-label={isVisible ? 'ซ่อนรายการรายละเอียด' : 'แสดงรายการรายละเอียด'}
        aria-expanded={isVisible}
        onClick={() => setIsVisible((v) => !v)}
        className="mb-4 flex items-center gap-2 text-lg font-bold text-textBody"
      >
        รายการรายละเอียด
        {isVisible ? (
          <FiMinusCircle size={18} className="text-textBody/60" />
        ) : (
          <FiPlusCircle size={18} className="text-textBody/60" />
        )}
      </button>

      {isVisible && (
        <div className="rounded-[20px] bg-white p-6">
          <div className="thin-scrollbar overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <colgroup>
                {COLUMNS.map((col) => (
                  <col key={col.key} style={{ width: col.width }} />
                ))}
              </colgroup>
              <thead>
                <tr className="border-b border-peaBorder text-left text-textBody/80">
                  {COLUMNS.map((col) => (
                    <th key={col.key} className="px-3 py-3.5 text-sm font-semibold">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.rows.map((row) => (
                  <tr
                    key={row.caseNumber}
                    className="h-14 border-b border-peaBorder last:border-b-0 hover:bg-pageBg"
                  >
                    <td className="px-3">{row.orgName}</td>
                    <td className="px-3">{row.durationDays}</td>
                    <td className="px-3">{row.meterNumber}</td>
                    <td className="px-3">{row.complaintType}</td>
                    <td className="px-3">{row.customerVoiceType}</td>
                    <td className="px-3">{row.caseNumber}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-end gap-3 text-sm text-textBody/60">
            <span>
              {rangeStart} - {rangeEnd} of {totalItems} items
            </span>
            <button
              type="button"
              aria-label="ก่อนหน้า"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              className="flex items-center gap-1 disabled:cursor-not-allowed disabled:opacity-40 enabled:text-searchBtn enabled:hover:underline"
            >
              <FiChevronLeft size={14} />
              ก่อนหน้า
            </button>
            <button
              type="button"
              aria-label="ถัดไป"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              className="flex items-center gap-1 disabled:cursor-not-allowed disabled:opacity-40 enabled:text-searchBtn enabled:hover:underline"
            >
              ถัดไป
              <FiChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
