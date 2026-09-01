import type { KpiSummary } from '../../types/dashboard';

interface KpiCardProps {
  label: string;
  value: number;
  colorClass: string;
  large?: boolean;
}

function KpiCard({ label, value, colorClass, large }: KpiCardProps) {
  return (
    <div className="flex flex-col items-center">
      <span className="mb-3 text-center text-base font-semibold text-textBody">
        {label}
      </span>
      <span
        className={`flex items-center justify-center rounded-full font-bold text-textBody ${colorClass} ${
          large
            ? 'h-[110px] w-full max-w-[280px] text-3xl sm:text-[42px]'
            : 'h-[90px] w-full max-w-[220px] text-2xl sm:text-[34px]'
        }`}
      >
        {value.toLocaleString('th-TH')}
      </span>
    </div>
  );
}

interface StatusStatProps {
  label: string;
  value: number;
}

function StatusStat({ label, value }: StatusStatProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <span className="text-base font-semibold text-textBody">{label}</span>
      <span className="mt-1 text-2xl font-bold text-textBody sm:text-[26px]">
        {value.toLocaleString('th-TH')}
      </span>
    </div>
  );
}

interface KpiCardsProps {
  kpi: KpiSummary;
}

export function KpiCards({ kpi }: KpiCardsProps) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.05)] sm:p-10">
      <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-3 sm:gap-y-10">
        <KpiCard
          label="จำนวนเรื่องร้องเรียนทั้งหมด"
          value={kpi.totalComplaints}
          colorClass="bg-kpiCyan"
          large
        />
        <KpiCard label="ภาคเหนือ" value={kpi.regionNorth} colorClass="bg-kpiGreen" />
        <KpiCard
          label="ภาคตะวันออกเฉียงเหนือ"
          value={kpi.regionNortheast}
          colorClass="bg-kpiGreen"
        />
        <KpiCard label="สำนักงานใหญ่" value={kpi.regionHq} colorClass="bg-kpiPurple" large />
        <KpiCard label="ภาคกลาง" value={kpi.regionCentral} colorClass="bg-kpiGreen" />
        <KpiCard label="ภาคใต้" value={kpi.regionSouth} colorClass="bg-kpiGreen" />
      </div>
      <div className="mt-8 grid grid-cols-3 gap-x-6 sm:mt-8">
        <StatusStat label="อยู่ระหว่างดำเนินการ" value={kpi.statusInProgress} />
        <StatusStat label="ปิดเรื่อง" value={kpi.statusClosed} />
        <StatusStat label="ยกเลิก" value={kpi.statusCancelled} />
      </div>
    </div>
  );
}
