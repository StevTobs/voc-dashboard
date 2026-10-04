import React from 'react';
import { numberLabel, percentLabel } from '../data/overview.js';
import { Fade } from './Cards.jsx';

function StatusIcon({ kind }) {
  return <span className={`status-icon ${kind}`} aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {kind === 'closed' ? <><rect x="2" y="3" width="20" height="18" rx="3" /><path d="m6 12 4 4 8-8" /></> : kind === 'pending' ? <><path d="M20 12a8 8 0 1 1-4-7M20 3v5h-5" /><path d="M12 7v5l3 2" /></> : <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /></>}
  </svg></span>;
}

function StatusTile({ label, tone, deadline, count, percentage, percent = true }) {
  return <div className="status-tile">
    {label && <div className={`status-tile-heading ${tone}`}><div className="status-label"><h3>{label}</h3>{deadline && <small className="status-deadline">{deadline}</small>}</div>{percent && <Fade>{percentLabel(percentage)}</Fade>}</div>}
    <p className="status-value"><Fade>{numberLabel(count)}</Fade> เรื่อง</p>
  </div>;
}

function StatusGroup({ title, kind, summary, children }) {
  return <section className={`status-group ${kind}`} aria-label={title}>
    <div className="status-heading"><StatusIcon kind={kind} /><h2>{title}</h2>{kind !== 'all' && <><Fade className="group-value">{`${numberLabel(summary?.total)} เรื่อง`}</Fade><Fade className="group-percent">{percentLabel(summary?.percentage)}</Fade></>}</div>
    <div className="status-tiles">{children}</div>
  </section>;
}

export default function StatusSummary({ data, ready }) {
  const metric = (group, label) => ready ? (data[group].sla.find(item => item.value === label) ?? { count: 0, percentage: 0 }) : {};
  return <div className="status-summary">
    <StatusGroup title="ปิดคำร้อง" kind="closed" summary={ready ? data.closed : null}><StatusTile label="เกินกำหนด" {...metric('closed', 'เกินกำหนด')} tone="overdue" deadline="(>30 วัน)" /><StatusTile label="ภายในกำหนด" {...metric('closed', 'ภายในกำหนด')} tone="on-time" deadline="(<=30 วัน)" /></StatusGroup>
    <StatusGroup title="อยู่ระหว่างดำเนินการ" kind="pending" summary={ready ? data.pending : null}><StatusTile label="เกินกำหนด" {...metric('pending', 'เกินกำหนด')} tone="overdue" deadline="(>30 วัน)" /><StatusTile label="ใกล้ครบกำหนด" {...metric('pending', 'ใกล้ครบกำหนด')} tone="due-soon" deadline="(>=15 วัน)" /><StatusTile label="ภายในกำหนด" {...metric('pending', 'ภายในกำหนด')} tone="on-time" deadline="(<=30 วัน)" /></StatusGroup>
    <StatusGroup title="รวมคำร้องทั้งหมด" kind="all"><StatusTile percent={false} count={ready ? data.total : null} /></StatusGroup>
  </div>;
}
