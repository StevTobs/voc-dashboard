/** Canonical business categories, not metric values or filter options. */
/** Status groups as in voc_status.group_status_th; every status except ปิด counts as อยู่ระหว่างดำเนินการ. */
export const STATUSES = ['ปิด', 'รอดำเนินการ', 'กำลังดำเนินการ', 'ส่งต่อ'];
export const CLOSED_STATUS = 'ปิด';
export const VOICE_TYPES = ['ร้องเรียน', 'ข้อเสนอแนะ/ข้อคิดเห็น', 'แจ้งเหตุ', 'แจ้งเบาะแส', 'ชื่นชม'];
/** Data from the database buffer uses this when a source value has no mapping yet (see buffer/mapping.json). */
export const UNKNOWN_VALUE = 'ไม่ระบุ';
/** Area of system-test cases (no request_pea, see buffer/mapping.json no_request_pea). They are extra data: never counted in any statistic. */
export const TEST_REGION = 'ไม่ระบุ (สตภ. ทดสอบระบบ)';
/** Why a record is incomplete (no area or no voice type), or null when it is complete.
 * A record with an area but no การไฟฟ้า (e.g. "ไม่ระบุ (ก.2)") still counts: it belongs to that area. */
export function incompleteReason(record) {
  const missing = value => String(value ?? '').startsWith(UNKNOWN_VALUE);
  if (record.region === TEST_REGION) return 'ไม่ระบุพื้นที่ (สตภ. ทดสอบระบบ)';
  if (missing(record.region)) return 'ไม่ระบุพื้นที่';
  // C- cases always count, even without a voice type (they appear as a grey ไม่ระบุ slice).
  if (missing(record.voice_type_level1) && !String(record.complaint_id).startsWith('C-')) return 'ไม่ระบุประเภทเสียง';
  return null;
}
/** Every missing core field of a record (area, การไฟฟ้า, voice type, หัวข้อ), e.g. ['ไม่ระบุการไฟฟ้า']; empty when complete. */
export function dataProblems(record) {
  const missing = value => String(value ?? '').startsWith(UNKNOWN_VALUE);
  return [
    record.region === TEST_REGION ? 'ไม่ระบุพื้นที่ (สตภ. ทดสอบระบบ)' : missing(record.region) && 'ไม่ระบุพื้นที่',
    missing(record.pea_office) && record.region !== TEST_REGION && 'ไม่ระบุการไฟฟ้า',
    missing(record.voice_type_level1) && 'ไม่ระบุประเภทเสียง',
    missing(record.topic_level2) && 'ไม่ระบุหัวข้อ',
  ].filter(Boolean);
}
/** Splits off incomplete records so no chart, total or filter ever counts them (every donut then sums to the same total).
 * testRecords lists every record with a data problem, counted or not; it is shown (with the problems)
 * only when the TEST_REGION option is picked in the พื้นที่ filter. */
export function splitTestRecords(records) {
  const testRecords = records.filter(record => dataProblems(record).length);
  return { records: records.some(incompleteReason) ? records.filter(record => !incompleteReason(record)) : records, testRecords };
}
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
