import React from 'react';
import { UNKNOWN_VALUE } from '../data/schema.js';

// Shells deliberately receive no metrics or sample records. Chart/KPI rendering is deferred to Round 3.
/** Re-mounts on every new value so changed text fades in instead of snapping. */
export function Fade({ as: Tag = 'span', className = '', children, ...props }) {
  return <Tag key={String(children)} className={`fade-text ${className}`.trim()} {...props}>{children}</Tag>;
}


export const unknownVoiceType = { label: UNKNOWN_VALUE, color: 'unknown' };
/** Charts only draw the five reference types; "ไม่ระบุ" is never charted. */
export const voiceTypesFor = () => voiceTypes;

/** "ไม่ระบุ" and fallback names such as "ไม่ระบุ (ฉ.2)" are left out of every chart. */
export const isUnknown = value => String(value ?? '').startsWith(UNKNOWN_VALUE);
/** Drops unknown rows and unknown stacked segments, then recounts so bars and percentages reflect only what is drawn. */
export function withoutUnknown(rows) {
  const kept = rows.filter(row => !isUnknown(row.value)).map(row => {
    if (!row.groups) return row;
    const groups = row.groups.filter(group => !isUnknown(group.value));
    return { ...row, groups, count: groups.reduce((sum, group) => sum + group.count, 0) };
  });
  const total = kept.reduce((sum, row) => sum + row.count, 0);
  return kept.map(row => ({ ...row, percentage: total ? row.count / total * 100 : 0 }));
}

export const voiceTypes = [
  { label: 'ร้องเรียน', color: 'complaint' },
  { label: 'ข้อเสนอแนะ/ข้อคิดเห็น', color: 'suggestion' },
  { label: 'แจ้งเหตุ', color: 'incident' },
  { label: 'แจ้งเบาะแส', color: 'tip' },
  { label: 'ชื่นชม', color: 'praise' },
];

export function Card({ title, subtitle, className = '', fadeTitle = false, children }) {
  return <section className={`card ${className}`} aria-label={title}>
    <div className="card-heading">{fadeTitle ? <Fade as="h2">{title}</Fade> : <h2>{title}</h2>}{subtitle && <p>{subtitle}</p>}</div>
    {children}
  </section>;
}

export function KpiShell({ label, color = 'total' }) {
  return <section className={`kpi ${color}`} aria-label={label}>
    <div className="kpi-label"><span className={`dot ${color}`} aria-hidden="true" />{label}</div>
    <div className="kpi-value" aria-label="ยังไม่มีข้อมูล">—<span>รายการ</span></div>
    <p>รอเชื่อมต่อการแสดงผล</p>
  </section>;
}

export function ChartCard({ title, subtitle, kind = 'bar', className = '', legend = false }) {
  return <Card title={title} subtitle={subtitle} className={`chart-card ${className}`}>
    <div className="chart-empty">
      <div className={`chart-symbol ${kind}`} aria-hidden="true">{kind !== 'donut' && <><i /><i /><i /><i /><i /></>}</div>
      <strong>รอเชื่อมต่อกราฟ</strong>
      <p>พื้นที่แสดงกราฟในรอบถัดไป</p>
    </div>
    {legend && <ul className="legend">{(Array.isArray(legend) ? legend : voiceTypes).map(type => <li key={type.color}><span className={`dot ${type.color}`} />{type.label}</li>)}</ul>}
  </Card>;
}
