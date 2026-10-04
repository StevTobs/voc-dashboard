/** Canonical business categories, not metric values or filter options. */
/** Status groups as in voc_status.group_status_th; every status except ปิด counts as อยู่ระหว่างดำเนินการ. */
export const STATUSES = ['ปิด', 'รอดำเนินการ', 'กำลังดำเนินการ', 'ส่งต่อ'];
export const CLOSED_STATUS = 'ปิด';
export const VOICE_TYPES = ['ร้องเรียน', 'ข้อเสนอแนะ/ข้อคิดเห็น', 'แจ้งเหตุ', 'แจ้งเบาะแส', 'ชื่นชม'];
/** Data from the database buffer uses this when a source value has no mapping yet (see buffer/mapping.json). */
export const UNKNOWN_VALUE = 'ไม่ระบุ';
export const SLA_STATUSES = ['เกินกำหนด', 'ใกล้ครบกำหนด', 'ภายในกำหนด'];
export const HIERARCHY_FIELDS = ['voice_type_level1', 'topic_level2', 'issue_level3', 'subissue_level4'];
export const REQUIRED_FIELDS = ['complaint_id', 'created_at', 'closed_at', 'status', 'year', 'month', 'region', 'pea_office', 'contact_channel', ...HIERARCHY_FIELDS, 'sla_status'];

function dateOnly(value, field, nullable = false) {
  if (!value && nullable) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw Error(`${field}: expected YYYY-MM-DD`);
  const date = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw Error(`${field}: invalid calendar date`);
  return value;
}

/** @returns {import('./types').ComplaintRecord} */
export function normalizeRecord(raw) {
  const record = Object.fromEntries(REQUIRED_FIELDS.map(field => [field, (raw[field] ?? '').trim().normalize('NFC')]));
  for (const field of REQUIRED_FIELDS) {
    if (field !== 'closed_at' && !record[field]) throw Error(`${field}: required`);
  }
  record.created_at = dateOnly(record.created_at, 'created_at');
  record.closed_at = dateOnly(record.closed_at, 'closed_at', true);
  if (!/^\d{4}$/.test(record.year) || !/^\d{1,2}$/.test(record.month)) throw Error('year/month: expected Gregorian numeric values');
  record.year = Number(record.year);
  record.month = Number(record.month);
  if (record.year !== Number(record.created_at.slice(0, 4)) || record.month !== Number(record.created_at.slice(5, 7))) throw Error('year/month: must match created_at');
  if (!STATUSES.includes(record.status)) throw Error('status: unknown category');
  if (!VOICE_TYPES.includes(record.voice_type_level1) && record.voice_type_level1 !== UNKNOWN_VALUE) throw Error('voice_type_level1: unknown category');
  if (!SLA_STATUSES.includes(record.sla_status)) throw Error('sla_status: unknown category');
  if ((record.status === CLOSED_STATUS) !== Boolean(record.closed_at)) throw Error('closed_at: required only for closed records');
  if (record.closed_at && record.closed_at < record.created_at) throw Error('closed_at: precedes created_at');
  if (record.closed_at && record.sla_status === 'ใกล้ครบกำหนด') throw Error('sla_status: closed record cannot be nearing deadline');
  return Object.freeze(record);
}
