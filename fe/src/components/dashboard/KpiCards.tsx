import type { KpiSummary } from '../../types/dashboard';

interface KpiCardProps {
  label: string;
  value: number;
  colorClass: string;
  large?: boolean;
}

function KpiCard({ label, value, colorClass, large }: KpiCardProps) {
  return (
    <div
      className={`flex flex-col justify-center rounded-lg ${colorClass} px-5 py-4 shadow-sm`}
    >
      <span className="text-sm font-medium text-textBody/80">{label}</span>
      <span
        className={`font-bold text-textBody ${large ? 'text-4xl' : 'text-2xl'}`}
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
    <div className="flex flex-col items-center justify-center px-4 py-3 text-center">
      <span className="text-3xl font-bold text-textBody">
        {value.toLocaleString('th-TH')}
      </span>
      <span className="text-sm text-textBody/70">{label}</span>
    </div>
  );
}

interface KpiCardsProps {
  kpi: KpiSummary;
}

export function KpiCards({ kpi }: KpiCardsProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard label="สำนักงานใหญ่" value={kpi.regionHq} colorClass="bg-kpiPurple" />
        <KpiCard label="ภาคกลาง" value={kpi.regionCentral} colorClass="bg-kpiGreen" />
        <KpiCard label="ภาคใต้" value={kpi.regionSouth} colorClass="bg-kpiGreen" />
      </div>
      <div className="grid grid-cols-3 divide-x divide-peaBorder rounded-lg border border-peaBorder bg-white">
        <StatusStat label="อยู่ระหว่างดำเนินการ" value={kpi.statusInProgress} />
        <StatusStat label="ปิดเรื่อง" value={kpi.statusClosed} />
        <StatusStat label="ยกเลิก" value={kpi.statusCancelled} />
      </div>
    </div>
  );
}
