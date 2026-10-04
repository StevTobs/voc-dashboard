import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { USES_BUFFER, useDashboardData } from '../data/DataProvider.jsx';

const POLL_MS = 30000;
const TOAST_MS = 5000;
const TOAST_TEXT = { success: 'ข้อมูลได้ทำการอัพเดทเรียบร้อยแล้ว', failed: 'ไม่สามารถแสดงข้อมูลได้ ณ ขณะนี้ กรุณาลองใหม่อีกครั้ง' };
const STATES = { online: 'เชื่อมต่อแล้ว', offline: 'เชื่อมต่อไม่ได้', not_configured: 'ไม่ได้เชื่อมต่อ' };
const time = value => value ? new Date(value).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) : '—';

function Database({ label, health }) {
  const state = health?.state ?? 'not_configured';
  const latest = health?.tables?.voc_master?.latest_update;
  const detail = state === 'online' ? `ตอบสนอง ${health.latency_ms} ms · อัปเดตล่าสุด ${time(latest)}` : health?.error ?? '';
  return <span className={`db-state ${state}`} title={detail}><span className="db-dot" aria-hidden="true" />{label}: {STATES[state] ?? state}</span>;
}

/** Shown only when the dashboard reads from the database buffer; polls its status and reloads on a new snapshot. */
export default function DataSourceStatus() {
  const { reload } = useDashboardData();
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  // Result banner for the automatic pull, shown just below the header.
  const [toast, setToast] = useState(null);
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);
  const showToast = kind => setToast({ kind, top: Math.max(0, document.querySelector('.header')?.getBoundingClientRect().bottom ?? 0), at: Date.now() });
  const snapshotId = useRef(null);
  const accept = useCallback(next => {
    setStatus(next); setError('');
    const id = next.snapshot?.id ?? null;
    if (snapshotId.current && id && id !== snapshotId.current) reload();
    snapshotId.current = id;
  }, [reload]);
  useEffect(() => {
    if (!USES_BUFFER) return undefined;
    let active = true;
    const poll = () => fetch(`${import.meta.env.BASE_URL}api/status`, { cache: 'no-store' })
      .then(response => response.ok ? response.json() : Promise.reject(Error(`HTTP ${response.status}`)))
      .then(next => { if (active) accept(next); })
      .catch(reason => { if (active) setError(`ติดต่อ buffer ไม่ได้ (${reason.message})`); });
    poll();
    const timer = setInterval(poll, POLL_MS);
    return () => { active = false; clearInterval(timer); };
  }, [accept]);
  // Every page load (first visit or browser refresh) asks the buffer for a fresh pull; the cached snapshot shows meanwhile
  // and the dashboard reloads in place once the new snapshot arrives. The ref keeps StrictMode from pulling twice.
  const pulled = useRef(false);
  useEffect(() => {
    if (!USES_BUFFER || pulled.current) return;
    pulled.current = true;
    fetch(`${import.meta.env.BASE_URL}api/refresh`, { method: 'POST', headers: { 'X-Buffer-Refresh': '1' } })
      .then(response => response.ok ? response.json() : Promise.reject(Error(`HTTP ${response.status}`)))
      .then(next => {
        accept(next);
        // The buffer answers 200 even when the database pull failed; that still counts as a failure here.
        showToast(next.last_refresh?.ok === false ? 'failed' : 'success');
      })
      .catch(reason => { setError(`ดึงข้อมูลใหม่ไม่สำเร็จ (${reason.message})`); showToast('failed'); });
  }, [accept]);
  if (!USES_BUFFER) return null;
  const snapshot = status?.snapshot;
  return <div className="data-source" role="status" aria-label="สถานะแหล่งข้อมูล">
    {error ? <span className="db-state offline"><span className="db-dot" aria-hidden="true" />{error}</span> : <>
      <span>ข้อมูลจาก {status?.source?.label ?? '…'} · ดึงเมื่อ {time(snapshot?.created_at)}{snapshot ? ` · ${snapshot.rows.toLocaleString('th-TH')} รายการ` : ''}</span>
      {snapshot?.stale && <span className="data-warning" title={status.last_refresh?.error ?? ''}>ข้อมูลอาจไม่เป็นปัจจุบัน</span>}
      {/* One badge: is the database the dashboard reads from reachable? */}
      {status && <Database label="ฐานข้อมูล" health={status.databases?.[status.source?.kind]} />}
    </>}
    {toast && createPortal(<div key={toast.at} className={`refresh-toast ${toast.kind}`} role={toast.kind === 'failed' ? 'alert' : 'status'} style={{ top: toast.top }}>
      {TOAST_TEXT[toast.kind]}<button type="button" aria-label="ปิดข้อความ" onClick={() => setToast(null)}>×</button>
    </div>, document.body)}
  </div>;
}
