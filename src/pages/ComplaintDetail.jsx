import React, { useMemo } from 'react';
import HorizontalChart from '../components/HorizontalChart.jsx';
import { useDashboardData } from '../data/DataProvider.jsx';
import { useFilters } from '../data/FilterProvider.jsx';
import { countBy, countByPair } from '../data/aggregations.js';
import { withoutUnknown } from '../components/Cards.jsx';

const ranked = rows => [...rows].sort((a, b) => b.count - a.count || a.value.localeCompare(b.value, 'th'));

export default function ComplaintDetail() {
  const { status } = useDashboardData();
  const { detailRecords: records } = useFilters();
  const charts = useMemo(() => [
    { title: 'การไฟฟ้า 10 อันดับแรกที่มีเสียงมากที่สุด', rows: ranked(withoutUnknown(countBy(records, 'pea_office'))).slice(0, 10) },
    { title: 'ช่องทางการติดต่อทั้งหมด', rows: ranked(countBy(records, 'contact_channel')) },
    { title: 'ประเภทเสียง (Level 1)', rows: countBy(records, 'voice_type_level1'), colored: true },
    { title: 'แสดงหัวข้อ (Level 2)', rows: ranked(countByPair(records, 'topic_level2', 'voice_type_level1')), stacked: true },
    { title: 'แสดงประเด็นเสียง (Level 3)', rows: ranked(countByPair(records, 'issue_level3', 'voice_type_level1')), stacked: true },
    { title: 'แสดงประเด็นย่อย (Level 4)', rows: ranked(countByPair(records, 'subissue_level4', 'voice_type_level1')), stacked: true },
  ], [records]);
  return <div className="detail-grid">{charts.map(chart => <HorizontalChart key={chart.title} {...chart} status={status} />)}</div>;
}
