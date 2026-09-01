import type { ReactNode } from 'react';
import type { DashboardCharts } from '../../types/dashboard';
import { HorizontalBarChart } from '../charts/HorizontalBarChart';

interface ChartBlockProps {
  title: string;
  className?: string;
  children: ReactNode;
}

function ChartBlock({ title, className, children }: ChartBlockProps) {
  return (
    <div className={className}>
      <h3 className="mb-4 text-center text-base font-bold text-textBody">
        {title}
      </h3>
      {children}
    </div>
  );
}

interface ChartsSectionProps {
  charts: DashboardCharts;
}

export function ChartsSection({ charts }: ChartsSectionProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-[20px] bg-white p-6 sm:p-10">
        <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 sm:gap-x-[60px] sm:gap-y-12">
          <ChartBlock title="ประเภทของเสียง level 1">
            <HorizontalBarChart data={charts.voiceTypeLevel1} />
          </ChartBlock>
          <ChartBlock title="ประเด็น Level 3">
            <HorizontalBarChart data={charts.issueLevel3} scrollable />
          </ChartBlock>
          <ChartBlock title="หัวข้อ Level 2">
            <HorizontalBarChart data={charts.topicLevel2} />
          </ChartBlock>
          <ChartBlock title="ประเด็นย่อย Level 4">
            <HorizontalBarChart data={charts.subIssueLevel4} scrollable />
          </ChartBlock>
        </div>
        <ChartBlock title="ช่องทางการแจ้ง" className="mt-12">
          <HorizontalBarChart
            data={charts.channel}
            height={420}
            domain={[0, 400000]}
            ticks={[0, 200000, 400000]}
          />
        </ChartBlock>
      </div>

      <div className="rounded-[20px] bg-white p-6 sm:p-10">
        <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 sm:gap-x-[60px]">
          <ChartBlock title="จำนวนการไฟฟ้าที่มีเสียงสูงสุด">
            <HorizontalBarChart data={charts.topElectricOffices} scrollable />
          </ChartBlock>
          <ChartBlock title="เขตพื้นที่">
            <HorizontalBarChart data={charts.regionZone} />
          </ChartBlock>
        </div>
      </div>
    </div>
  );
}
