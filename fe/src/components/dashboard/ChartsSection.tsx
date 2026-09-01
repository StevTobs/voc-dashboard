import type { ReactNode } from 'react';
import type { DashboardCharts } from '../../types/dashboard';
import { HorizontalBarChart } from '../charts/HorizontalBarChart';

interface ChartCardProps {
  title: string;
  children: ReactNode;
}

function ChartCard({ title, children }: ChartCardProps) {
  return (
    <div className="rounded-lg border border-peaBorder bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-textBody">{title}</h3>
      {children}
    </div>
  );
}

interface ChartsSectionProps {
  charts: DashboardCharts;
}

export function ChartsSection({ charts }: ChartsSectionProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ChartCard title="ประเภทของเสียง level 1">
        <HorizontalBarChart data={charts.voiceTypeLevel1} />
      </ChartCard>
      <ChartCard title="หัวข้อ Level 2">
        <HorizontalBarChart data={charts.topicLevel2} />
      </ChartCard>
      <ChartCard title="ประเด็น Level 3">
        <HorizontalBarChart data={charts.issueLevel3} scrollable />
      </ChartCard>
      <ChartCard title="ประเด็นย่อย Level 4">
        <HorizontalBarChart data={charts.subIssueLevel4} scrollable />
      </ChartCard>
      <ChartCard title="ช่องทางการแจ้ง">
        <HorizontalBarChart data={charts.channel} />
      </ChartCard>
      <ChartCard title="จำนวนการไฟฟ้าที่มีเสียงสูงสุด">
        <HorizontalBarChart data={charts.topElectricOffices} scrollable />
      </ChartCard>
      <ChartCard title="เขตพื้นที่">
        <HorizontalBarChart data={charts.regionZone} />
      </ChartCard>
    </div>
  );
}
