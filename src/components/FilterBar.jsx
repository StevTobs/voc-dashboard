import React, { useEffect, useState } from 'react';
import { useDashboardData } from '../data/DataProvider.jsx';
import { useFilters } from '../data/FilterProvider.jsx';
import { DEFAULT_FILTERS, FILTER_FIELDS, OFFICE_FILTER, applyFilters, mismatchedOffices, normalizeFilters, officesForRegions, sameFilters } from '../data/filters.js';
import { TEST_REGION } from '../data/schema.js';
import MultiSelect from './MultiSelect.jsx';
import { useToast } from './Toast.jsx';

const count = value => value.toLocaleString('th-TH');

export default function FilterBar({ detail = false, onApply, onReset }) {
  const data = useDashboardData();
  const { filters, options, apply, reset } = useFilters();
  // Edits stay in a draft until ค้นหา; the applied filters live only in FilterProvider.
  const [draft, setDraft] = useState(filters);
  const [message, setMessage] = useState('');
  useEffect(() => { setDraft(filters); }, [filters]);
  const pending = !sameFilters(normalizeFilters(draft), filters);
  const mismatch = detail ? mismatchedOffices(draft, options.office) : [];
  // Keep mismatched picks visible in the list so the user can untick them.
  const officeOptions = [...officesForRegions(options.office, draft.region), ...options.office.filter(option => mismatch.includes(option.value))];
  const update = key => next => { setDraft(current => ({ ...current, [key]: next })); setMessage(''); };
  const [showToast, toast] = useToast();
  function search(event) {
    event.preventDefault();
    if (data.status !== 'ready') { showToast('failed', 'ค้นหาไม่สำเร็จ: ยังโหลดข้อมูลไม่เสร็จ กรุณาลองใหม่อีกครั้ง'); return; }
    if (mismatch.length) { showToast('failed', `ค้นหาไม่สำเร็จ: ${mismatch.join(', ')} ไม่อยู่ในพื้นที่ที่เลือก`); return; }
    apply(draft);
    onApply?.();
    setMessage('ใช้ตัวกรองแล้ว');
    // Same rows the page will show (the detail page also narrows by การไฟฟ้า).
    const next = normalizeFilters(draft);
    const found = applyFilters(applyFilters(data.records, next), next, detail ? [OFFICE_FILTER] : []).length;
    const extra = next.region.includes(TEST_REGION) ? applyFilters(data.testRecords, next).length : 0;
    const extraText = extra ? ` · ข้อมูลส่วนเกิน ${count(extra)} เรื่อง (ไม่นับในสถิติ)` : '';
    if (found || extra) showToast('success', `ค้นหาสำเร็จ พบ ${count(found)} รายการ${extraText}`);
    else showToast('empty', 'ค้นหาสำเร็จ แต่ไม่พบข้อมูลตามตัวกรองที่เลือก');
  }
  function clear(event) {
    event.preventDefault();
    reset();
    setDraft(DEFAULT_FILTERS);
    onReset?.();
    setMessage('ล้างค่าตัวกรองแล้ว');
  }
  const ready = data.status === 'ready';
  return <section className="filters" aria-label="ตัวกรองข้อมูล">
    <form onSubmit={search} onReset={clear}>
      <div className="filter-row">
        {FILTER_FIELDS.map(({ key, label, allLabel }) => <MultiSelect key={key} label={label} allLabel={allLabel} options={options[key]} value={draft[key]} disabled={!ready}
          onChange={update(key)} />)}
        {detail && <MultiSelect searchable label={OFFICE_FILTER.label} options={officeOptions} value={draft.office} disabled={!ready} onChange={update('office')}
          error={mismatch.length ? `${mismatch.join(', ')} ไม่อยู่ในพื้นที่ที่เลือก` : undefined} />}
        <button type="submit" className="button primary" disabled={!ready}>ค้นหา</button>
        <button type="reset" className="button secondary"><span aria-hidden="true">↻</span> ล้างค่า</button>
      </div>
      <p className="filter-status" role="status">{pending ? 'มีการเปลี่ยนตัวกรอง กด ค้นหา เพื่อแสดงผล' : message}</p>
    </form>
    {toast}
  </section>;
}

/** "แสดง x จาก y รายการ" line, shown in the bottom status bar; row-level problems are listed in its tooltip. */
export function FilterSummary({ detail = false }) {
  const data = useDashboardData();
  const { filteredRecords, detailRecords } = useFilters();
  const shown = detail ? detailRecords : filteredRecords;
  return <p className="filter-note" role="status" title={data.issues.map(issue => `แถว ${issue.row}: ${issue.message}`).join('\n') || undefined}>
    {data.status === 'loading' ? 'กำลังโหลดข้อมูล CSV…' : data.status === 'error' ? `โหลด CSV ไม่สำเร็จ: ${data.error}` : `แสดง ${shown.length.toLocaleString('th-TH')} จาก ${data.model.total.toLocaleString('th-TH')} รายการ${data.issues.length ? ` · ข้ามข้อมูลไม่ถูกต้อง ${data.issues.length} แถว` : ''}${detail ? '' : ' · คลิกส่วนของกราฟโดนัทเพื่อกรองข้อมูล'}`}
  </p>;
}
