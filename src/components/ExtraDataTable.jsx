import React from 'react';
import { dataProblems, incompleteReason } from '../data/schema.js';

const thaiDate = value => new Date(`${value}T00:00:00`).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });

/** Lists records with missing data and says, for each, what is missing and whether it is counted in the statistics. */
export default function ExtraDataTable({ records }) {
  // Not-counted records first, then by date.
  const sorted = [...records].sort((a, b) => Boolean(incompleteReason(b)) - Boolean(incompleteReason(a)) || a.created_at.localeCompare(b.created_at) || a.complaint_id.localeCompare(b.complaint_id));
  const excluded = records.filter(record => incompleteReason(record)).length;
  const n = value => value.toLocaleString('th-TH');
  return <div className="extra-data">
    <h3>ข้อมูลไม่ครบ {n(records.length)} เรื่อง (ไม่นับในสถิติ {n(excluded)} เรื่อง · นับในสถิติ {n(records.length - excluded)} เรื่อง)</h3>
    <p className="extra-data-note">เรื่องที่ไม่ระบุพื้นที่ (เช่น สตภ. ทดสอบระบบ) ไม่ถูกนับในสถิติใดๆ ส่วนเรื่องเลขที่ C- ที่ข้อมูลบางช่องหายไปยังนับในสถิติตามปกติ แต่แสดงไว้ที่นี่เพื่อให้ตรวจสอบและแก้ไขข้อมูล</p>
    <div className="extra-data-scroll" tabIndex="0" role="region" aria-label="รายการข้อมูลส่วนเกิน">
      <table>
        <thead><tr><th>นับในสถิติ</th><th>ข้อมูลที่ขาด</th><th>เลขที่</th><th>วันรับเรื่อง</th><th>พื้นที่</th><th>การไฟฟ้า</th><th>สถานะ</th><th>ช่องทาง</th><th>ประเภทเสียง</th><th>หัวข้อ (L2)</th><th>ประเด็น (L3)</th><th>SLA</th></tr></thead>
        <tbody>{sorted.map(record => <tr key={record.complaint_id}>
          <td>{incompleteReason(record) ? 'ไม่นับ' : 'นับ'}</td><td>{dataProblems(record).join(', ')}</td><td>{record.complaint_id}</td><td>{thaiDate(record.created_at)}</td><td>{record.region}</td><td>{record.pea_office}</td><td>{record.status}</td><td>{record.contact_channel}</td>
          <td>{record.voice_type_level1}</td><td>{record.topic_level2}</td><td>{record.issue_level3}</td><td>{record.sla_status}</td>
        </tr>)}</tbody>
      </table>
    </div>
  </div>;
}
