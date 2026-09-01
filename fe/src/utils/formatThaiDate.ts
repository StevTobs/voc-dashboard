const THAI_DAY_NAMES = [
  'วันอาทิตย์',
  'วันจันทร์',
  'วันอังคาร',
  'วันพุธ',
  'วันพฤหัสบดี',
  'วันศุกร์',
  'วันเสาร์',
];

const THAI_MONTH_ABBR = [
  'มค.',
  'กพ.',
  'มีค.',
  'เมย.',
  'พค.',
  'มิย.',
  'กค.',
  'สค.',
  'กย.',
  'ตค.',
  'พย.',
  'ธค.',
];

/**
 * Formats an ISO datetime string into the Thai display format used across
 * the dashboard, e.g. "วันจันทร์ที่ 3 สค. 69 เวลา 10.00 น."
 */
export function formatThaiDateTime(isoString: string): string {
  const date = new Date(isoString);

  const dayName = THAI_DAY_NAMES[date.getDay()];
  const day = date.getDate();
  const monthAbbr = THAI_MONTH_ABBR[date.getMonth()];
  const buddhistYear = date.getFullYear() + 543;
  const shortYear = String(buddhistYear).slice(-2);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${dayName}ที่ ${day} ${monthAbbr} ${shortYear} เวลา ${hours}.${minutes} น.`;
}
