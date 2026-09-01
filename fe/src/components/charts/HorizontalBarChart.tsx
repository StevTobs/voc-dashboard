import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TooltipContentProps } from 'recharts';
import type { ChartDataPoint } from '../../types/dashboard';

interface HorizontalBarChartProps {
  data: ChartDataPoint[];
  scrollable?: boolean;
}

const BAR_ROW_HEIGHT = 32;
const VISIBLE_HEIGHT = 280;

function formatAxisValue(value: number): string {
  if (value >= 1000) {
    const thousands = value / 1000;
    return `${thousands % 1 === 0 ? thousands : thousands.toFixed(1)}k`;
  }
  return `${value}`;
}

function ChartTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload as ChartDataPoint;
  return (
    <div className="rounded-md bg-tooltipBg px-3 py-1.5 text-sm font-medium text-textBody shadow-md">
      {point.label}: {formatAxisValue(point.value)}
    </div>
  );
}

export function HorizontalBarChart({ data, scrollable }: HorizontalBarChartProps) {
  const contentHeight = Math.max(data.length * BAR_ROW_HEIGHT, VISIBLE_HEIGHT);
  const containerHeight = scrollable ? VISIBLE_HEIGHT : contentHeight;

  const chart = (
    <ResponsiveContainer width="100%" height={contentHeight}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 28, bottom: 4, left: 4 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8E8" />
        <XAxis
          type="number"
          tickFormatter={formatAxisValue}
          tick={{ fontSize: 11, fill: '#333' }}
        />
        <YAxis
          type="category"
          dataKey="label"
          width={160}
          tick={{ fontSize: 11, fill: '#333' }}
          interval={0}
        />
        <Tooltip content={ChartTooltip} cursor={{ fill: 'rgba(191,166,160,0.15)' }} />
        <Bar
          dataKey="value"
          fill="#BFA6A0"
          radius={[0, 4, 4, 0]}
          barSize={16}
          isAnimationActive={false}
        />
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <div
      className={scrollable ? 'thin-scrollbar overflow-y-auto' : ''}
      style={{ height: containerHeight }}
    >
      {chart}
    </div>
  );
}
