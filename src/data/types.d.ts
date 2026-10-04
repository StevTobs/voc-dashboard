export interface ComplaintRecord {
  complaint_id: string;
  /** Gregorian date-only YYYY-MM-DD, no timezone conversion. */
  created_at: string;
  closed_at: string | null;
  status: 'รับเรื่อง' | 'อยู่ระหว่างดำเนินการ' | 'ปิดคำร้อง';
  year: number;
  month: number;
  region: string;
  pea_office: string;
  contact_channel: string;
  voice_type_level1: 'ร้องเรียน' | 'ข้อเสนอแนะ/ข้อคิดเห็น' | 'แจ้งเหตุ' | 'แจ้งเบาะแส' | 'ชื่นชม';
  topic_level2: string;
  issue_level3: string;
  subissue_level4: string;
  /** Source snapshot classification; not recalculated using today's date. */
  sla_status: 'เกินกำหนด' | 'ใกล้ครบกำหนด' | 'ภายในกำหนด';
}
export interface DataIssue { row: number; message: string; }
export interface CsvResult {
  records: readonly ComplaintRecord[];
  issues: DataIssue[];
}
