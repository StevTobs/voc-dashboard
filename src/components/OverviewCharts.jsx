import React, { useRef, useState } from 'react';
import { Card, Fade, unknownVoiceType, voiceTypes, voiceTypesFor, withoutUnknown } from './Cards.jsx';
import { REGION_ORDER } from '../data/filters.js';
import { numberLabel, percentLabel } from '../data/overview.js';

const regionColors = { 'ภาคเหนือ':'#ac4dbb', 'ภาคตะวันออกเฉียงเหนือ':'#711490', 'ภาคกลาง':'#f3917c', 'ภาคใต้':'#c453a9', 'สำนักงานใหญ่':'#ffc274',
  // Areas reuse their region's hue in three shades so neighbouring areas stay distinguishable.
  'น.1':'#c98ad3', 'น.2':'#ac4dbb', 'น.3':'#7e2f8b', 'ฉ.1':'#9a4dbb', 'ฉ.2':'#711490', 'ฉ.3':'#4b0c60',
  'ก.1':'#f8b7a8', 'ก.2':'#f3917c', 'ก.3':'#d9684f', 'ต.1':'#e08ccb', 'ต.2':'#c453a9', 'ต.3':'#932f7c', 'สนญ.':'#ffc274' };
const MAX_CALLOUTS_PER_SIDE = 5;
const voiceColors = { complaint:'#ee405b', suggestion:'#ff9c24', incident:'#ffdf5b', tip:'#89f8bb', praise:'#00884c', unknown:'#b5b5b5' };
const colorFor = (value, voice) => voice ? voiceColors[[...voiceTypes, unknownVoiceType].find(type => type.label === value)?.color] ?? '#777' : regionColors[value] ?? '#777';
const RING_OUTER = 144;
const LEADER_RADIUS = 160;
const message = status => status === 'loading' ? 'กำลังโหลดข้อมูล…' : status === 'error' ? 'โหลดข้อมูลไม่สำเร็จ' : 'ไม่พบข้อมูล';

export function DonutChart({ title, rows: allRows, status, voice = false, selected, onSelect }) {
  // ไม่ระบุ is not charted: slices, percentages and the centre total cover only the drawn categories.
  const rows = withoutUnknown(allRows);
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const order = voice
    ? ['ข้อเสนอแนะ/ข้อคิดเห็น', 'แจ้งเหตุ', 'แจ้งเบาะแส', 'ชื่นชม', 'ร้องเรียน']
    : ['ภาคกลาง', 'สำนักงานใหญ่', 'ภาคตะวันออกเฉียงเหนือ', 'ภาคเหนือ', 'ภาคใต้', ...REGION_ORDER.slice(5)];
  const rank = value => { const index = order.indexOf(value); return index < 0 ? order.length : index; };
  const ordered = [...rows].sort((a, b) => rank(a.value) - rank(b.value));
  let offset = 0;
  const slices = ordered.map(row => {
    const start = offset; offset += row.percentage;
    const angle = (start + row.percentage / 2) / 100 * Math.PI * 2 - Math.PI / 2;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const label = row.value === 'ภาคตะวันออกเฉียงเหนือ' ? ['ภาคตะวันออก', 'เฉียงเหนือ'] : row.value === 'ข้อเสนอแนะ/ข้อคิดเห็น' ? ['ข้อเสนอแนะ/', 'ข้อคิดเห็น'] : [row.value];
    // Leader starts on the ring's outer edge and leaves radially before bending toward its label.
    return { ...row, start, label, right: cos >= 0,
      x: 300 + cos * (RING_OUTER + 2), y: 150 + sin * (RING_OUTER + 2),
      bx: 300 + cos * LEADER_RADIUS, by: 150 + sin * LEADER_RADIUS };
  });
  const dimmed = row => selected != null && selected !== row.value;
  // With many slices (e.g. 13 areas) only the largest per side get a callout; the rest stay in the legend and tooltip.
  const callouts = [false, true].flatMap(right => slices.filter(row => !dimmed(row) && row.right === right)
    .sort((a, b) => b.count - a.count).slice(0, MAX_CALLOUTS_PER_SIDE));
  for (const right of [false, true]) {
    const side = callouts.filter(row => row.right === right).sort((a, b) => a.by - b.by);
    // Keep each label near its slice, then push apart so text blocks never overlap or leave the frame.
    // Text sits entirely above its leader line, so the line only underlines it.
    const top = row => 48 + (row.label.length - 1) * 19;
    const gap = row => 54 + (row.label.length - 1) * 19;
    side.forEach((row, index) => { row.labelY = Math.max(row.by, top(row), index ? side[index - 1].labelY + gap(row) : -Infinity); });
    for (let index = side.length - 1; index >= 0; index--) {
      const limit = index === side.length - 1 ? 284 : side[index + 1].labelY - gap(side[index + 1]);
      side[index].labelY = Math.min(side[index].labelY, limit);
    }
    side.forEach(row => {
      const dy = row.labelY - 150;
      const clearance = Math.sqrt(Math.max(0, LEADER_RADIUS ** 2 - dy ** 2)) + 10;
      const elbow = Math.max(Math.abs(row.bx - 300) + 6, clearance);
      row.elbowX = right ? 300 + elbow : 300 - elbow;
    });
  }
  return <Card title={title} className="chart-card live-donut reference-donut">
    {status !== 'ready' || !total ? <div className="overview-empty">{message(status)}</div> : <>
      <div className="donut-visual"><svg viewBox="-40 -12 680 336" aria-label={`${title} รวม ${numberLabel(total)} เรื่อง`}>
        {slices.map(row => <circle key={row.value} cx="300" cy="150" r="106" fill="none" strokeWidth="76" pathLength="100" style={{ stroke: dimmed(row) ? '#e8e8e8' : colorFor(row.value, voice), strokeDasharray: `${row.percentage} ${100 - row.percentage}`, strokeDashoffset: -row.start }} transform="rotate(-90 300 150)" aria-pressed={onSelect ? selected === row.value : undefined} tabIndex="0" role={onSelect ? 'button' : 'img'} aria-label={`${row.value}: ${numberLabel(row.count)} เรื่อง (${percentLabel(row.percentage)})`} onClick={onSelect ? () => onSelect(row.value) : undefined} onKeyDown={onSelect ? event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(row.value); } } : undefined}><title>{row.value}: {numberLabel(row.count)} เรื่อง ({percentLabel(row.percentage)})</title></circle>)}
        {callouts.map(row => {
          const end = row.right ? 632 : -32;
          const { label } = row;
          return <g style={{pointerEvents:'none'}} key={row.value} className="donut-callout" aria-hidden="true">
            <polyline points={`${row.x},${row.y} ${row.bx},${row.by} ${row.elbowX},${row.labelY} ${end},${row.labelY}`} fill="none" stroke="#222" strokeWidth="1.5" strokeLinejoin="round" />
            <text x={end} y={row.labelY - 29 - (label.length - 1) * 19} textAnchor={row.right ? 'end' : 'start'}>{label.map((line, index) => <tspan x={end} dy={index ? 19 : 0} key={line}>{line}</tspan>)}</text>
            <Fade as="text" x={end} y={row.labelY - 7} textAnchor={row.right ? 'end' : 'start'} className="donut-callout-value">{`${numberLabel(row.count)} เรื่อง (${percentLabel(row.percentage)})`}</Fade>
          </g>;
        })}
        <text style={{pointerEvents:'none'}} x="300" y="134" textAnchor="middle" className="reference-center-caption"><tspan x="300">จำนวนเสียง</tspan><tspan x="300" dy="19">ทั้งหมด</tspan></text>
        <Fade as="text" style={{pointerEvents:'none'}} x="300" y="175" textAnchor="middle" className="reference-center-caption">{`${numberLabel(total)} เรื่อง`}</Fade>
        
      </svg></div>
      <ul className="reference-donut-legend">{ordered.map(row => <li key={row.value}><span className="dot" style={{background:colorFor(row.value, voice)}} />{row.value}</li>)}</ul>
    </>}
  </Card>;
}

export function OfficeChart({ rows: allRows, status, onSelect, title = 'เสียงของลูกค้าจำแนกตามการไฟฟ้า' }) {
  const rows = withoutUnknown(allRows);
  const visible = rows.filter(row => !row.hidden);
  const types = voiceTypesFor(visible);
  const clickable = row => Boolean(onSelect && row.selectable && !row.hidden);
  const maximum = Math.max(0, ...rows.map(row => row.count));
  // Gridline step rounded up to 1, 2, 2.5 or 5 × 10ⁿ (axis reads 0 / 1,000 / 2,000 …); 3–6 steps reach just above the tallest bar.
  const rough = Math.max(1, maximum / 6), magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = Math.max(1, Math.ceil([1, 2, 2.5, 5, 10].find(factor => factor * magnitude >= rough) * magnitude));
  const steps = Math.max(3, Math.ceil(maximum / step));
  const ceiling = step * steps;
  const areaRef = useRef(null);
  const tipRef = useRef(null);
  const [hover, setHover] = useState(null);
  // Anchor the tooltip at the pointer (or the bar top for keyboard focus), kept inside the chart area.
  const place = (row, clientX, clientY) => {
    const area = areaRef.current.getBoundingClientRect();
    const width = tipRef.current?.offsetWidth ?? 260, height = tipRef.current?.offsetHeight ?? 180;
    const x = clientX - area.left, y = clientY - area.top;
    const left = Math.min(Math.max(x - width / 2, 4), area.width - width - 4);
    const below = y - height - 16 < -area.top;
    setHover({ row, left, top: below ? y + 18 : y - height - 16, arrow: x - left, below });
  };
  const focusBar = (row, element) => { const box = element.getBoundingClientRect(); place(row, box.left + box.width / 2, box.top); };
  return <Card title={title} fadeTitle className="chart-card main-chart live-office-chart">
    {status !== 'ready' || !visible.length ? <div className="overview-empty">{message(status)}</div> : <>
      <div className="office-chart-area" ref={areaRef} style={{ '--grid-step': `${100 / steps}%` }}>
        <div className="office-axis" aria-hidden="true">{Array.from({length:steps + 1}, (_, i) => <Fade key={i}>{numberLabel(ceiling - i * step)}</Fade>)}</div>
        <div className="office-scroll" onScroll={() => setHover(null)}><div className="office-columns" style={{minWidth:`${visible.length * 66}px`}}>
          {rows.map(row => <div className={`office-column${row.hidden ? ' is-hidden' : ''}`} key={row.key ?? row.value} aria-hidden={row.hidden || undefined}>
            <div className="office-bar-space"><div className={`office-bar${clickable(row) ? ' is-clickable' : ''}`} style={{height:`${row.count / ceiling * 100}%`}} tabIndex={row.hidden ? -1 : 0} role={clickable(row) ? 'button' : 'img'} aria-label={`${row.value}: ${numberLabel(row.count)} เรื่อง`}
              onMouseMove={event => place(row, event.clientX, event.clientY)} onMouseLeave={() => setHover(null)}
              onFocus={event => focusBar(row, event.currentTarget)} onBlur={() => setHover(null)}
              onClick={clickable(row) ? () => onSelect(row.value) : undefined} onKeyDown={clickable(row) ? event => {if(event.key === 'Enter' || event.key === ' ') {event.preventDefault();onSelect(row.value);}} : undefined}>
              {[...types].reverse().map(type => { const value = row.groups.find(group => group.value === type.label); return <span key={type.color} style={{height:`${row.count ? (value?.count ?? 0) / row.count * 100 : 0}%`,background:voiceColors[type.color]}} />; })}
            </div></div>
            <span className="office-label">{row.value}</span>
          </div>)}
        </div></div>
        {hover && <div ref={tipRef} className={`office-tooltip${hover.below ? ' below' : ''}`} role="tooltip" style={{left:hover.left, top:hover.top, '--arrow-x':`${hover.arrow}px`}}>
          {types.map(type => <div className="office-tooltip-row" key={type.color}>
            <span className="office-tooltip-swatch" style={{background:voiceColors[type.color]}} />
            <span>{type.label.replace('/', ' / ')}</span>
            <span className="office-tooltip-value">{numberLabel(hover.row.groups.find(group => group.value === type.label)?.count ?? 0)}</span>
          </div>)}
        </div>}
      </div>
    </>}
  </Card>;
}
