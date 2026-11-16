import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Card, Fade, isUnknown, unknownVoiceType, voiceTypes, voiceTypesFor, withoutUnknown } from './Cards.jsx';
import { REGION_ORDER } from '../data/filters.js';
import { numberLabel, percentLabel } from '../data/overview.js';
import ExtraDataTable from './ExtraDataTable.jsx';

const regionColors = { 'ภาคเหนือ':'#ac4dbb', 'ภาคตะวันออกเฉียงเหนือ':'#711490', 'ภาคกลาง':'#f3917c', 'ภาคใต้':'#c453a9', 'สำนักงานใหญ่':'#ffc274',
  // Areas reuse their region's hue in three shades so neighbouring areas stay distinguishable.
  'น.1':'#c98ad3', 'น.2':'#ac4dbb', 'น.3':'#7e2f8b', 'ฉ.1':'#9a4dbb', 'ฉ.2':'#711490', 'ฉ.3':'#4b0c60',
  'ก.1':'#f8b7a8', 'ก.2':'#f3917c', 'ก.3':'#d9684f', 'ต.1':'#e08ccb', 'ต.2':'#c453a9', 'ต.3':'#932f7c', 'สนญ.':'#ffc274' };
const MAX_CALLOUTS_PER_SIDE = 5;
const voiceColors = { complaint:'#ee405b', suggestion:'#ff9c24', incident:'#ffdf5b', tip:'#89f8bb', praise:'#00884c', unknown:'#b5b5b5' };
/** Merges every unknown value into one grey "ไม่ระบุ" slice, so each donut's total covers every counted record. */
function withUnknownSlice(rows) {
  const known = rows.filter(row => !isUnknown(row.value));
  const unknownCount = rows.filter(row => isUnknown(row.value)).reduce((sum, row) => sum + row.count, 0);
  const all = unknownCount ? [...known, { value: UNKNOWN_SLICE, count: unknownCount }] : known;
  const total = all.reduce((sum, row) => sum + row.count, 0);
  return all.map(row => ({ ...row, percentage: total ? row.count / total * 100 : 0 }));
}
const UNKNOWN_SLICE = unknownVoiceType.label;
const colorFor = (value, voice) => value === UNKNOWN_SLICE ? voiceColors.unknown : voice ? voiceColors[[...voiceTypes, unknownVoiceType].find(type => type.label === value)?.color] ?? '#777' : regionColors[value] ?? '#777';
const RING_OUTER = 144;
const RING_INNER = 68;
/**
 * One donut slice as a filled ring segment (percent from 12 o'clock, clockwise).
 * Drawn as its own shape instead of a dashed circle stroke, which leaves a join spike at the circle's start point.
 */
function slicePath(startPercent, percent) {
  const point = (radius, value) => {
    const angle = value / 100 * Math.PI * 2 - Math.PI / 2;
    return `${(300 + Math.cos(angle) * radius).toFixed(3)} ${(150 + Math.sin(angle) * radius).toFixed(3)}`;
  };
  // A full ring is two half arcs (one arc cannot start and end on the same point).
  if (percent >= 99.999) return slicePath(0, 50) + ' ' + slicePath(50, 50);
  const end = startPercent + percent, large = percent > 50 ? 1 : 0;
  return `M${point(RING_OUTER, startPercent)} A${RING_OUTER} ${RING_OUTER} 0 ${large} 1 ${point(RING_OUTER, end)} L${point(RING_INNER, end)} A${RING_INNER} ${RING_INNER} 0 ${large} 0 ${point(RING_INNER, startPercent)}Z`;
}
const LEADER_RADIUS = 160;
const LABEL_FONT = '11px Prompt, sans-serif';
const LABEL_HEIGHT = 65;        // horizontal labels (up to 3 short lines)
const MAX_VERTICAL_LABEL = 120; // vertical labels: longer names are cut with …
let measureContext = null;
const textWidth = text => {
  measureContext ??= document.createElement('canvas').getContext('2d');
  measureContext.font = LABEL_FONT;
  return measureContext.measureText(text).width;
};

const splitLabel = value => value === 'ภาคตะวันออกเฉียงเหนือ' ? ['ภาคตะวันออก', 'เฉียงเหนือ'] : value === 'ข้อเสนอแนะ/ข้อคิดเห็น' ? ['ข้อเสนอแนะ/', 'ข้อคิดเห็น'] : [value];
// Do segments p1-p2 and p3-p4 cross?
const crosses = (a, b, c, d) => {
  const side = (p, q, r) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
  return side(a, b, c) * side(a, b, d) < 0 && side(c, d, a) * side(c, d, b) < 0;
};
// Shortest distance from the donut centre to segment a-b.
const centreDistance = (a, b) => {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((300 - a[0]) * dx + (150 - a[1]) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(a[0] + t * dx - 300, a[1] + t * dy - 150);
};

/** Slices and callout positions for one starting rotation (percent of a turn), with a score: lower looks better. */
function layoutDonut(ordered, rotation, dimmed) {
  let offset = 0;
  const slices = ordered.map(row => {
    const start = offset; offset += row.percentage;
    const angle = (rotation + start + row.percentage / 2) / 100 * Math.PI * 2 - Math.PI / 2;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    // Leader starts on the ring's outer edge; bx/by (just outside the ring) seed where the label sits.
    return { ...row, start, drawStart: rotation + start, label: splitLabel(row.value), right: cos >= 0,
      x: 300 + cos * (RING_OUTER + 2), y: 150 + sin * (RING_OUTER + 2),
      bx: 300 + cos * LEADER_RADIUS, by: 150 + sin * LEADER_RADIUS };
  });
  // With many slices (e.g. 13 areas) only the largest per side get a callout; the rest stay in the legend and tooltip.
  const callouts = [false, true].flatMap(right => slices.filter(row => !dimmed(row) && row.value !== UNKNOWN_SLICE && row.right === right)
    .sort((a, b) => b.count - a.count).slice(0, MAX_CALLOUTS_PER_SIDE));
  let score = 0;
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
      // Straight leader: one segment from the ring edge to where the label's underline starts (kept outside the ring).
      const elbow = Math.max(Math.abs(row.x - 300) + 14, clearance);
      row.elbowX = right ? 300 + elbow : 300 - elbow;
      row.leader = [[row.x, row.y], [row.elbowX, row.labelY]];
      score += Math.abs(row.labelY - row.by);
      if (centreDistance(...row.leader) < RING_OUTER) score += 1000;   // leader cuts through the ring
    });
    side.forEach((row, index) => side.slice(index + 1).forEach(other => {
      if (crosses(...row.leader, ...other.leader)) score += 1000;    // leaders cross
      score += Math.max(0, 12 - Math.hypot(row.x - other.x, row.y - other.y)) * 4;   // leaders start on top of each other
    }));
  }
  return { slices, callouts, score };
}
const message = status => status === 'loading' ? 'กำลังโหลดข้อมูล…' : status === 'error' ? 'โหลดข้อมูลไม่สำเร็จ' : 'ไม่พบข้อมูล';

export function DonutChart({ title, rows: allRows, status, voice = false, selected, onSelect, layoutRows = allRows }) {
  // Every counted record is in the donut (unknowns as one grey slice), so both donuts show the same total.
  const rows = withUnknownSlice(allRows);
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const order = voice
    ? ['ข้อเสนอแนะ/ข้อคิดเห็น', 'แจ้งเหตุ', 'แจ้งเบาะแส', 'ชื่นชม', 'ร้องเรียน']
    : ['ภาคกลาง', 'สำนักงานใหญ่', 'ภาคตะวันออกเฉียงเหนือ', 'ภาคเหนือ', 'ภาคใต้', ...REGION_ORDER.slice(5)];
  const rank = value => { const index = order.indexOf(value); return index < 0 ? order.length : index; };
  const ordered = [...rows].sort((a, b) => rank(a.value) - rank(b.value));
  const layoutOrdered = [...withUnknownSlice(layoutRows)].sort((a, b) => rank(a.value) - rank(b.value));
  // Voice legend reads ชื่นชม → แจ้งเบาะแส → แจ้งเหตุ → ข้อเสนอแนะ → ร้องเรียน (slices keep their own order).
  const legendOrder = ['ชื่นชม', 'แจ้งเบาะแส', 'แจ้งเหตุ', 'ข้อเสนอแนะ/ข้อคิดเห็น', 'ร้องเรียน'];
  const legendRank = value => { const index = legendOrder.indexOf(value); return index < 0 ? legendOrder.length : index; };
  const legendRows = voice ? [...ordered].sort((a, b) => legendRank(a.value) - legendRank(b.value)) : ordered;
  const dimmed = row => selected != null && selected !== row.value;
  // Try every starting angle and keep the one whose labels sit closest to their slices with no crossing leaders
  // (small neighbouring slices end up at the sides, where their labels can spread vertically).
  // The angle comes from the unselected data with nothing dimmed, so clicking slices keeps the donut where it was.
  const rotation = useMemo(() => {
    let best = null;
    for (let turn = 0; turn < 100; turn++) {
      const { score } = layoutDonut(layoutOrdered, turn, () => false);
      if (!best || score < best.score - 0.5) best = { turn, score };
    }
    return best.turn;
  }, [layoutOrdered.map(row => `${row.value}:${row.count}`).join('|')]);
  const { slices, callouts } = layoutDonut(ordered, rotation, dimmed);
  // The centre follows the chosen slice, so it always matches what the rest of the page is showing.
  const shownTotal = rows.find(row => row.value === selected)?.count ?? total;
  return <Card title={title} className="chart-card live-donut reference-donut">
    {status !== 'ready' || !total ? <div className="overview-empty">{message(status)}</div> : <>
      <div className="donut-visual"><svg viewBox="-40 -12 680 336" aria-label={`${title} รวม ${numberLabel(total)} เรื่อง`}>
        {slices.map(row => {
          // Grey (dimmed) slices are not clickable; only the chosen slice can be clicked again to clear the selection.
          const clickable = Boolean(onSelect) && !dimmed(row);
          return <path key={row.value} className="donut-slice" d={slicePath(row.drawStart, row.percentage)} style={{ fill: dimmed(row) ? '#e8e8e8' : colorFor(row.value, voice) }} aria-pressed={clickable ? selected === row.value : undefined} tabIndex={clickable ? 0 : -1} role={clickable ? 'button' : 'img'} aria-label={`${row.value}: ${numberLabel(row.count)} เรื่อง (${percentLabel(row.percentage)})`} onClick={clickable ? () => onSelect(row.value) : undefined} onKeyDown={clickable ? event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(row.value); } } : undefined}><title>{row.value}: {numberLabel(row.count)} เรื่อง ({percentLabel(row.percentage)})</title></path>;
        })}
        {callouts.map(row => {
          const end = row.right ? 632 : -32;
          const { label } = row;
          return <g style={{pointerEvents:'none'}} key={row.value} className="donut-callout" aria-hidden="true">
            <polyline points={`${row.x},${row.y} ${row.elbowX},${row.labelY} ${end},${row.labelY}`} fill="none" stroke="#222" strokeWidth="1.5" strokeLinejoin="round" />
            <text x={end} y={row.labelY - 29 - (label.length - 1) * 19} textAnchor={row.right ? 'end' : 'start'}>{label.map((line, index) => <tspan x={end} dy={index ? 19 : 0} key={line}>{line}</tspan>)}</text>
            <Fade as="text" x={end} y={row.labelY - 7} textAnchor={row.right ? 'end' : 'start'} className="donut-callout-value">{`${numberLabel(row.count)} เรื่อง (${percentLabel(row.percentage)})`}</Fade>
          </g>;
        })}
        {shownTotal === total ? <>
          <text style={{pointerEvents:'none'}} x="300" y="134" textAnchor="middle" className="reference-center-caption"><tspan x="300">จำนวนเสียง</tspan><tspan x="300" dy="19">ทั้งหมด</tspan></text>
          <Fade as="text" style={{pointerEvents:'none'}} x="300" y="175" textAnchor="middle" className="reference-center-caption">{`${numberLabel(total)} เรื่อง`}</Fade>
        </> : <>
          {/* A slice is chosen: จำนวน <chosen> จากทั้งหมด <total> */}
          <text style={{pointerEvents:'none'}} x="300" y="118" textAnchor="middle" className="reference-center-caption small">จำนวน</text>
          <Fade as="text" style={{pointerEvents:'none'}} x="300" y="140" textAnchor="middle" className="reference-center-caption">{`${numberLabel(shownTotal)} เรื่อง`}</Fade>
          <text style={{pointerEvents:'none'}} x="300" y="166" textAnchor="middle" className="reference-center-caption small">จากทั้งหมด</text>
          <Fade as="text" style={{pointerEvents:'none'}} x="300" y="187" textAnchor="middle" className="reference-center-caption small">{`${numberLabel(total)} เรื่อง`}</Fade>
        </>}
        
      </svg></div>
      <ul className="reference-donut-legend">{legendRows.map(row => <li key={row.value}><span className="dot" style={{background:colorFor(row.value, voice)}} />{row.value}</li>)}</ul>
    </>}
  </Card>;
}

/** extraRecords: system-test cases picked in the พื้นที่ filter; listed as a table in the chart area, never counted in the bars. */
export function OfficeChart({ rows: allRows, status, onSelect, title = 'เสียงของลูกค้าจำแนกตามการไฟฟ้า', extraRecords = [] }) {
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
  // Names that do not fit their column on one line are turned vertical (all together), and the label row grows to fit them.
  const scrollRef = useRef(null);
  const [labels, setLabels] = useState({ vertical: false, height: LABEL_HEIGHT });
  const labelKey = visible.map(row => row.value).join('|');
  useLayoutEffect(() => {
    const element = scrollRef.current;
    if (!element || !visible.length) return undefined;
    const update = () => {
      const column = Math.max(element.clientWidth / visible.length, 40) - 6; // columns are at least 40px (they scroll beyond that)
      const longest = Math.max(...visible.map(row => textWidth(String(row.value))));
      const vertical = longest > column;
      const height = vertical ? Math.min(MAX_VERTICAL_LABEL, Math.ceil(longest) + 14) : LABEL_HEIGHT;
      setLabels(current => current.vertical === vertical && current.height === height ? current : { vertical, height });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [labelKey]);
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
    {status !== 'ready' || !visible.length ? (status === 'ready' && extraRecords.length ? null : <div className="overview-empty">{message(status)}</div>) : <>
      <div className={`office-chart-area${labels.vertical ? ' vertical-labels' : ''}`} ref={areaRef} style={{ '--grid-step': `${100 / steps}%`, '--label-h': `${labels.height}px` }}>
        <div className="office-axis" aria-hidden="true">{Array.from({length:steps + 1}, (_, i) => <Fade key={i}>{numberLabel(ceiling - i * step)}</Fade>)}</div>
        <div className="office-scroll" ref={scrollRef} onScroll={() => setHover(null)}><div className="office-columns" style={{minWidth:`${visible.length * 40}px`}}>
          {rows.map(row => <div className={`office-column${row.hidden ? ' is-hidden' : ''}`} key={row.key ?? row.value} aria-hidden={row.hidden || undefined}>
            <div className="office-bar-space"><div className={`office-bar${clickable(row) ? ' is-clickable' : ''}`} style={{height:`${row.count / ceiling * 100}%`}} tabIndex={row.hidden ? -1 : 0} role={clickable(row) ? 'button' : 'img'} aria-label={`${row.value}: ${numberLabel(row.count)} เรื่อง`}
              onMouseMove={event => place(row, event.clientX, event.clientY)} onMouseLeave={() => setHover(null)}
              onFocus={event => focusBar(row, event.currentTarget)} onBlur={() => setHover(null)}
              onClick={clickable(row) ? () => onSelect(row.value) : undefined} onKeyDown={clickable(row) ? event => {if(event.key === 'Enter' || event.key === ' ') {event.preventDefault();onSelect(row.value);}} : undefined}>
              {[...types].reverse().map(type => { const value = row.groups.find(group => group.value === type.label); return <span key={type.color} style={{height:`${row.count ? (value?.count ?? 0) / row.count * 100 : 0}%`,background:voiceColors[type.color]}} />; })}
            </div></div>
            <span className="office-label" title={row.value}>{row.value}</span>
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
    {status === 'ready' && extraRecords.length > 0 && <ExtraDataTable records={extraRecords} />}
  </Card>;
}
