import React, { useRef, useState } from 'react';
import { voiceTypesFor, withoutUnknown } from './Cards.jsx';

const format = value => value.toLocaleString('th-TH', { maximumFractionDigits: 1 });
const OFFSET = 12;

export default function HorizontalChart({ title, rows: allRows, stacked = false, colored = false, color = 'bar-purple', status }) {
  const rows = withoutUnknown(allRows);
  const maximum = Math.max(1, ...rows.map(row => row.count));
  const ceiling = Math.ceil(maximum / 5) * 5;
  // Voice-type order on this page: ชื่นชม → แจ้งเบาะแส → แจ้งเหตุ → ข้อเสนอแนะ → ร้องเรียน (stack segments, legend, tooltip).
  const voiceTypes = [...voiceTypesFor(rows)].reverse();
  // Level 1 rows read the same order bottom to top: ร้องเรียน on top, ชื่นชม at the bottom.
  if (colored) {
    const rank = value => { const index = voiceTypes.findIndex(type => type.label === value); return index < 0 ? -1 : index; };
    rows.sort((a, b) => rank(b.value) - rank(a.value));
  }
  const chartRef = useRef(null);
  const [hover, setHover] = useState(null);

  const barColor = row => colored ? voiceTypes.find(type => type.label === row.value)?.color || color : color;
  // Tooltip sits next to the given point (page coordinates), inside the chart card.
  const showAt = (row, clientX, clientY, active = null) => {
    const box = chartRef.current.getBoundingClientRect();
    const x = clientX - box.left, y = clientY - box.top;
    setHover({ row, x, y, active, flipX: x > box.width * 0.55, flipY: y < 120 });
  };
  const tooltipItems = row => stacked
    ? voiceTypes.map(type => ({ label: type.label, color: type.color, count: row.groups.find(group => group.value === type.label)?.count ?? 0 })).filter(item => item.count > 0)
    : [{ label: row.value, color: barColor(row), count: row.count }];

  return <section className="card horizontal-chart" aria-label={title} ref={chartRef}>
    <h2>{title}</h2>
    {status !== 'ready' || !rows.length ? <p className="chart-message">{status === 'loading' ? 'กำลังโหลดข้อมูล…' : status === 'error' ? 'ไม่สามารถโหลดข้อมูล CSV ได้' : 'ไม่พบข้อมูล'}</p> : <>
      <div className="horizontal-chart-scroll" tabIndex="0" role="region" aria-label={`${title} เลื่อนเพื่อดูรายการทั้งหมด`} onScroll={() => setHover(null)}>
        {rows.map(row => <div className="horizontal-row" key={row.value}>
          <span className="horizontal-label">{row.value}</span>
          <div className="horizontal-track">
            <div className="horizontal-bar" style={{ width: `${row.count / ceiling * 100}%` }} tabIndex="0"
              aria-label={`${row.value}: ${format(row.count)} เรื่อง${stacked ? ' — ' + tooltipItems(row).map(item => `${item.label} ${format(item.count)}`).join(', ') : ''}`}
              onMouseMove={event => showAt(row, event.clientX, event.clientY, event.target.dataset.type ?? null)}
              onMouseLeave={() => setHover(null)}
              onFocus={event => { const bar = event.currentTarget.getBoundingClientRect(); showAt(row, bar.right, bar.top + bar.height / 2); }}
              onBlur={() => setHover(null)}>
              {stacked ? voiceTypes.map(type => {
                const count = row.groups.find(group => group.value === type.label)?.count ?? 0;
                return count > 0 && <span key={type.color} data-type={type.label} className={`bar-segment ${type.color}`} style={{ width: `${count / row.count * 100}%` }} />;
              }) : <span className={`bar-segment ${barColor(row)}`} style={{ width: '100%' }} />}
            </div>
          </div>
          <span className="horizontal-count">{format(row.count)}</span>
        </div>)}
      </div>
      <div className="horizontal-axis" aria-hidden="true">{Array.from({length:6}, (_, index) => <span key={index}>{format(ceiling * index / 5)}</span>)}</div>
      <p className="axis-unit">จำนวนเรื่อง</p>
      {(stacked || colored) && <ul className="legend">{voiceTypes.map(type => <li key={type.color}><span className={`dot ${type.color}`} />{type.label}</li>)}</ul>}
      {hover && <div className="bar-tooltip" aria-hidden="true" style={{
        left: hover.x, top: hover.y,
        transform: `translate(${hover.flipX ? `calc(-100% - ${OFFSET}px)` : `${OFFSET}px`}, ${hover.flipY ? `${OFFSET}px` : `calc(-100% - ${OFFSET}px)`})`,
      }}>
        {tooltipItems(hover.row).map(item => <div className={`tooltip-item${hover.active === item.label ? ' active' : ''}`} key={item.label}>
          <span className={`tooltip-swatch ${item.color}`} />
          <span className="tooltip-label">{item.label}</span>
          <span className="tooltip-count">{format(item.count)}</span>
        </div>)}
      </div>}
    </>}
  </section>;
}
