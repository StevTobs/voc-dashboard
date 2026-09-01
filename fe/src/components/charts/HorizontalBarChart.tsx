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
  height?: number;
  domain?: [number, number];
  ticks?: number[];
}

const BAR_ROW_HEIGHT = 40;
const VISIBLE_HEIGHT = 260;

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
    <div className="relative rounded-md bg-tooltipBg px-2.5 py-1.5 text-xs font-medium text-textBody shadow-md">
      {point.label}: {formatAxisValue(point.value)}
      <span className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-[5px] border-t-[6px] border-x-transparent border-t-tooltipBg" />
    </div>
  );
}

export function HorizontalBarChart({
  data,
  scrollable,
  height,
  domain,
  ticks,
}: HorizontalBarChartProps) {
  const contentHeight =
    height ?? Math.max(data.length * BAR_ROW_HEIGHT, VISIBLE_HEIGHT);
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
          domain={domain}
          ticks={ticks}
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
