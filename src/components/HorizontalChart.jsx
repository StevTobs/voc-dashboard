import React from 'react';
import { voiceTypesFor } from './Cards.jsx';

const format = value => value.toLocaleString('th-TH', { maximumFractionDigits: 1 });

export default function HorizontalChart({ title, rows, stacked = false, colored = false, status }) {
  const maximum = Math.max(1, ...rows.map(row => row.count));
  const ceiling = Math.ceil(maximum / 5) * 5;
  const voiceTypes = voiceTypesFor(rows);
  return <section className="card horizontal-chart" aria-label={title}>
    <h2>{title}</h2>
    {status !== 'ready' || !rows.length ? <p className="chart-message">{status === 'loading' ? 'กำลังโหลดข้อมูล…' : status === 'error' ? 'ไม่สามารถโหลดข้อมูล CSV ได้' : 'ไม่พบข้อมูล'}</p> : <>
      <div className="horizontal-chart-scroll" tabIndex="0" role="region" aria-label={`${title} เลื่อนเพื่อดูรายการทั้งหมด`}>
        {rows.map(row => <div className="horizontal-row" key={row.value}>
          <span className="horizontal-label">{row.value}</span>
          <div className="horizontal-track">
            <div className="horizontal-bar" style={{ width: `${row.count / ceiling * 100}%` }} tabIndex="0" aria-label={`${row.value}: ${format(row.count)} เรื่อง`}>
              {stacked ? voiceTypes.map(type => {
                const count = row.groups.find(group => group.value === type.label)?.count ?? 0;
                return count > 0 && <span key={type.color} className={`bar-segment ${type.color}`} style={{ width: `${count / row.count * 100}%` }} />;
              }) : <span className={`bar-segment ${colored ? voiceTypes.find(type => type.label === row.value)?.color || 'bar-purple' : 'bar-purple'}`} style={{ width: '100%' }} />}
              <span className="bar-tooltip">{row.value}: {format(row.count)} เรื่อง{stacked && row.groups.map(group => <span key={group.value}>{group.value}: {format(group.count)} เรื่อง</span>)}</span>
            </div>
          </div>
          <span className="horizontal-count">{format(row.count)}</span>
        </div>)}
      </div>
      <div className="horizontal-axis" aria-hidden="true">{Array.from({length:6}, (_, index) => <span key={index}>{format(ceiling * index / 5)}</span>)}</div>
      <p className="axis-unit">จำนวนเรื่อง</p>
      {(stacked || colored) && <ul className="legend">{voiceTypes.map(type => <li key={type.color}><span className={`dot ${type.color}`} />{type.label}</li>)}</ul>}
    </>}
  </section>;
}
