import React, { useMemo } from 'react';
import StatusSummary from '../components/StatusSummary.jsx';
import { DonutChart, OfficeChart } from '../components/OverviewCharts.jsx';
import { useDashboardData } from '../data/DataProvider.jsx';
import { useFilters } from '../data/FilterProvider.jsx';
import { REGION_ORDER } from '../data/filters.js';
import { aggregateOverview, selectOverviewRecords } from '../data/overview.js';

export default function Overview({ selection, onSelectionChange }) {
  const { records, status } = useDashboardData();
  // Every KPI and chart below derives from this one filtered dataset.
  const { filteredRecords } = useFilters();
  const data = useMemo(() => aggregateOverview(selectOverviewRecords(filteredRecords, selection)), [filteredRecords, selection]);
  // Each donut ignores its own selection so it keeps the full breakdown and can highlight the chosen slice.
  const regionData = useMemo(() => aggregateOverview(selectOverviewRecords(filteredRecords, { ...selection, zone: null, region: null })), [filteredRecords, selection]);
  const voiceData = useMemo(() => aggregateOverview(selectOverviewRecords(filteredRecords, { ...selection, voice: null })), [filteredRecords, selection]);
  // The bar chart starts at region level and drills into that region's offices once a region is selected.
  // Both levels stay mounted in one stable order (hidden columns fade and collapse) so switching animates.
  const columns = useMemo(() => {
    const officeRegion = new Map(records.map(row => [row.pea_office, row.region]));
    const regionRank = value => { const index = REGION_ORDER.indexOf(value); return index < 0 ? REGION_ORDER.length : index; };
    const allRegions = [...new Set(records.map(row => row.region))].sort((a, b) => regionRank(a) - regionRank(b));
    const allOffices = aggregateOverview(records).offices.map(row => row.value)
      .sort((a, b) => regionRank(officeRegion.get(a)) - regionRank(officeRegion.get(b)));
    return { allRegions, allOffices };
  }, [records]);
  const bars = useMemo(() => {
    const drilled = Boolean(selection.region);
    const regions = new Map(data.regionGroups.map(row => [row.value, row]));
    const offices = new Map(data.offices.map(row => [row.value, row]));
    const empty = value => ({ value, count: 0, groups: [], hidden: true });
    return [
      ...columns.allRegions.map(value => ({ ...(!drilled && regions.get(value) || empty(value)), key: `region:${value}`, selectable: true })),
      ...columns.allOffices.map(value => ({ ...(drilled && offices.get(value) || empty(value)), key: `office:${value}` })),
    ];
  }, [data, columns, selection.region]);
  const toggle = (field, value) => onSelectionChange(previous => ({ ...previous, [field]: previous[field] === value ? null : value }));
  // A ภาค picked on the donut replaces any area drilled into on the bar chart.
  const toggleZone = value => onSelectionChange(previous => ({ ...previous, zone: previous.zone === value ? null : value, region: null }));
  return <>
    <StatusSummary data={data} ready={status === 'ready'} />
    <div className="overview-charts">
      <div className="donut-stack">
        <DonutChart title="จำแนกตามภาค" rows={regionData.zones} status={status} selected={selection.zone} onSelect={toggleZone} />
        <DonutChart title="ประเภทเสียง" rows={voiceData.voices} status={status} voice selected={selection.voice} onSelect={value => toggle('voice', value)} />
      </div>
      <OfficeChart rows={bars} status={status} onSelect={value => toggle('region', value)}
        title={selection.region ? `เสียงของลูกค้าจำแนกตามการไฟฟ้า · ${selection.region}` : `เสียงของลูกค้าจำแนกตามพื้นที่${selection.zone ? ` · ${selection.zone}` : ''}`} />
    </div>
  </>;
}
