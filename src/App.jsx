import React, { useEffect, useState } from 'react';
import { useDashboardData } from './data/DataProvider.jsx';
import Shell, { navigation } from './components/Shell.jsx';
import FilterBar, { FilterSummary } from './components/FilterBar.jsx';
import DataSourceStatus from './components/DataSourceStatus.jsx';
import Overview from './pages/Overview.jsx';
import ComplaintDetail from './pages/ComplaintDetail.jsx';

/** 'YYYY-MM-DD' → '1 กรกฎาคม 2569' (Thai Buddhist calendar). */
const thaiDate = iso => {
  if (!iso) return '—';
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
};

function currentPath() { return window.location.hash.slice(1) || '/overview'; }

export default function App() {
  const [chartSelection, setChartSelection] = useState({ zone: null, region: null, voice: null });
  const resetCharts = () => setChartSelection({ zone: null, region: null, voice: null });
  const { model } = useDashboardData();
  const [path, setPath] = useState(currentPath);
  useEffect(() => {
    function navigate() { setPath(currentPath()); }
    window.addEventListener('hashchange', navigate);
    return () => window.removeEventListener('hashchange', navigate);
  }, []);
  const page = navigation.find(item => item.path === path);
  useEffect(() => { document.title = `${page?.label || 'ไม่พบหน้า'} | PEA VOC Dashboard`; }, [page]);
  return <Shell path={path}>
    {page ? <>
      <div className="page-heading"><h1>{page.label}</h1><p>ข้อมูลตั้งแต่ {thaiDate(model.earliestRecordDate)} ถึง {thaiDate(model.latestRecordDate)}</p></div>
      {/* Record count and data source status stay pinned to the bottom of the window. */}
      <div className="data-status-bar">{!page.blank && <FilterSummary detail={page.detail} />}<DataSourceStatus /></div>
      {!page.blank && <FilterBar onApply={resetCharts} onReset={resetCharts} key={path} detail={page.detail} />}
      {page.blank ? null : path === '/overview' ? <Overview selection={chartSelection} onSelectionChange={setChartSelection} /> : <ComplaintDetail />}
    </> : <section className="card not-found"><h1>ไม่พบหน้าที่ต้องการ</h1><a href="#/overview">กลับไปหน้าภาพรวม</a></section>}
  </Shell>;
}
