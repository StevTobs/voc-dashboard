import React from 'react';
import { incompleteReason } from '../data/schema.js';

const thaiDate = value => new Date(`${value}T00:00:00`).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });

/** Lists system-test cases (ข้อมูลส่วนเกิน). They are shown for reference only and never counted in any statistic. */
export default function ExtraDataTable({ records }) {
  const sorted = [...records].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.complaint_id.localeCompare(b.complaint_id));
  const counts = records.reduce((map, record) => map.set(incompleteReason(record), (map.get(incompleteReason(record)) ?? 0) + 1), new Map());
  const summary = [...counts].map(([reason, count]) => `${reason} ${count.toLocaleString('th-TH')} เรื่อง`).join(', ');
  return <div className="extra-data">
    <h3>ข้อมูลไม่ครบ {records.length.toLocaleString('th-TH')} เรื่อง (ไม่นับในสถิติ)</h3>
    <p className="extra-data-note">เรื่องเหล่านี้ไม่ได้ระบุพื้นที่ การไฟฟ้า หรือประเภทเสียง จึงไม่ถูกนับในจำนวนเสียงทั้งหมดและในกราฟใดๆ ({summary})</p>
    <div className="extra-data-scroll" tabIndex="0" role="region" aria-label="รายการข้อมูลส่วนเกิน">
      <table>
        <thead><tr><th>สาเหตุ</th><th>เลขที่</th><th>วันรับเรื่อง</th><th>พื้นที่</th><th>การไฟฟ้า</th><th>สถานะ</th><th>ช่องทาง</th><th>ประเภทเสียง</th><th>หัวข้อ (L2)</th><th>ประเด็น (L3)</th><th>SLA</th></tr></thead>
        <tbody>{sorted.map(record => <tr key={record.complaint_id}>
          <td>{incompleteReason(record)}</td><td>{record.complaint_id}</td><td>{thaiDate(record.created_at)}</td><td>{record.region}</td><td>{record.pea_office}</td><td>{record.status}</td><td>{record.contact_channel}</td>
          <td>{record.voice_type_level1}</td><td>{record.topic_level2}</td><td>{record.issue_level3}</td><td>{record.sla_status}</td>
        </tr>)}</tbody>
      </table>
    </div>
  </div>;
}
