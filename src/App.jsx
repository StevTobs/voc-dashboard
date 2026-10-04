import React, { useEffect, useState } from 'react';
import { useDashboardData } from './data/DataProvider.jsx';
import Shell, { navigation } from './components/Shell.jsx';
import FilterBar from './components/FilterBar.jsx';
import DataSourceStatus from './components/DataSourceStatus.jsx';
import Overview from './pages/Overview.jsx';
import ComplaintDetail from './pages/ComplaintDetail.jsx';

function currentPath() { return window.location.hash.slice(1) || '/overview'; }

export default function App() {
  const [chartSelection, setChartSelection] = useState({ region: null, voice: null });
  const resetCharts = () => setChartSelection({ region: null, voice: null });
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
      <div className="page-heading"><h1>{path === '/complaint-detail' ? 'เสียงของลูกค้าด้านคุณภาพไฟฟ้า' : page.label}</h1><p>วันที่ล่าสุดในข้อมูล: {model.latestRecordDate || '—'}</p><DataSourceStatus /></div>
      <FilterBar onApply={resetCharts} onReset={resetCharts} key={path} detail={path === '/complaint-detail'} />
      {path === '/overview' ? <Overview selection={chartSelection} onSelectionChange={setChartSelection} /> : <ComplaintDetail />}
    </> : <section className="card not-found"><h1>ไม่พบหน้าที่ต้องการ</h1><a href="#/overview">กลับไปหน้าภาพรวม</a></section>}
  </Shell>;
}
