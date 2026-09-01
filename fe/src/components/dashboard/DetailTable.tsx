import { useEffect, useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiMaximize2 } from 'react-icons/fi';
import { useDetailTable } from '../../hooks/useDetailTable';
import type { DashboardFilters } from '../../types/dashboard';

const COLUMNS = [
  { key: 'orgName', label: 'ชื่อหน่วยงาน' },
  { key: 'durationDays', label: 'ระยะเวลา (วัน)' },
  { key: 'meterNumber', label: 'หมายเลขผู้ใช้ไฟ' },
  { key: 'complaintType', label: 'ประเภทเรื่องแจ้ง' },
  { key: 'customerVoiceType', label: 'ประเภทเสียงของลูกค้า' },
  { key: 'caseNumber', label: 'หมายเลขเคส' },
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
    <div className="rounded-lg border border-peaBorder bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-textBody">
          รายการรายละเอียด
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={isVisible ? 'ซ่อนตาราง' : 'แสดงตาราง'}
            onClick={() => setIsVisible((v) => !v)}
            className="rounded-md border border-peaBorder px-3 py-1 text-xs text-textBody hover:border-headerBg"
          >
            {isVisible ? 'ซ่อน' : 'แสดง'}
          </button>
          <button
            type="button"
            aria-label="ขยายรายการรายละเอียด"
            className="rounded-md border border-peaBorder p-1.5 text-textBody hover:border-headerBg"
          >
            <FiMaximize2 size={16} />
          </button>
        </div>
      </div>

      {isVisible && (
        <>
          <div className="thin-scrollbar overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-peaBorder text-left text-textBody/70">
                  {COLUMNS.map((col) => (
                    <th key={col.key} className="px-3 py-2 font-medium">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.rows.map((row) => (
                  <tr
                    key={row.caseNumber}
                    className="border-b border-peaBorder last:border-b-0 hover:bg-pageBg"
                  >
                    <td className="px-3 py-2">{row.orgName}</td>
                    <td className="px-3 py-2">{row.durationDays}</td>
                    <td className="px-3 py-2">{row.meterNumber}</td>
                    <td className="px-3 py-2">{row.complaintType}</td>
                    <td className="px-3 py-2">{row.customerVoiceType}</td>
                    <td className="px-3 py-2">{row.caseNumber}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex items-center justify-end gap-3 text-sm text-textBody/70">
            <span>
              {rangeStart} - {rangeEnd} of {totalItems} items
            </span>
            <button
              type="button"
              aria-label="ก่อนหน้า"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              className="flex items-center gap-1 rounded-md border border-peaBorder px-2 py-1 disabled:cursor-not-allowed disabled:opacity-40 hover:enabled:border-headerBg"
            >
              <FiChevronLeft size={14} />
              ก่อนหน้า
            </button>
            <button
              type="button"
              aria-label="ถัดไป"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              className="flex items-center gap-1 rounded-md border border-peaBorder px-2 py-1 disabled:cursor-not-allowed disabled:opacity-40 hover:enabled:border-headerBg"
            >
              ถัดไป
              <FiChevronRight size={14} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
