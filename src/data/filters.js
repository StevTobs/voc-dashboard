import { STATUSES, VOICE_TYPES } from './schema.js';

/** Display order for regions/areas (north → south, then headquarters). Unknown values sort last. */
export const REGION_ORDER = ['ภาคเหนือ', 'ภาคตะวันออกเฉียงเหนือ', 'ภาคกลาง', 'ภาคใต้', 'สำนักงานใหญ่',
  // PEA areas (เขต) delivered by the database buffer
  'น.1', 'น.2', 'น.3', 'ฉ.1', 'ฉ.2', 'ฉ.3', 'ก.1', 'ก.2', 'ก.3', 'ต.1', 'ต.2', 'ต.3', 'สนญ.'];
/** Areas (เขต) grouped into the four regions (ภาค) for the overview donut; head office (สนญ.) is its own slice. */
export const AREA_ZONES = {
  'น.1':'ภาคเหนือ', 'น.2':'ภาคเหนือ', 'น.3':'ภาคเหนือ', 'ภาคเหนือ':'ภาคเหนือ',
  'ฉ.1':'ภาคตะวันออกเฉียงเหนือ', 'ฉ.2':'ภาคตะวันออกเฉียงเหนือ', 'ฉ.3':'ภาคตะวันออกเฉียงเหนือ', 'ภาคตะวันออกเฉียงเหนือ':'ภาคตะวันออกเฉียงเหนือ',
  'ก.1':'ภาคกลาง', 'ก.2':'ภาคกลาง', 'ก.3':'ภาคกลาง', 'ภาคกลาง':'ภาคกลาง',
  'สนญ.':'สำนักงานใหญ่', 'สำนักงานใหญ่':'สำนักงานใหญ่',
  'ต.1':'ภาคใต้', 'ต.2':'ภาคใต้', 'ต.3':'ภาคใต้', 'ภาคใต้':'ภาคใต้',
};
/** Region (ภาค) of an area; values outside the table (e.g. ไม่ระบุ) stay as they are. */
export const zoneOf = region => AREA_ZONES[region] ?? region;
const THAI_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

/** The five main filters, each mapped to the CSV field it constrains. */
export const FILTER_FIELDS = [
  { key: 'status', label: 'สถานะ', field: 'status', allLabel: 'ทุกสถานะ' },
  { key: 'month', label: 'เดือน', field: 'month' },
  { key: 'year', label: 'ปี', field: 'year' },
  { key: 'voice', label: 'ประเภทเสียง', field: 'voice_type_level1' },
  { key: 'region', label: 'พื้นที่', field: 'region' },
];

/** Office filter is offered on the complaint-detail page and must agree with the selected regions. */
export const OFFICE_FILTER = { key: 'office', label: 'การไฟฟ้า', field: 'pea_office' };
const ALL_FILTER_FIELDS = [...FILTER_FIELDS, OFFICE_FILTER];

/** An empty selection means "ทั้งหมด" (no constraint on that field). */
export const DEFAULT_FILTERS = Object.freeze(Object.fromEntries(ALL_FILTER_FIELDS.map(({ key }) => [key, Object.freeze([])])));

const rankBy = order => value => { const index = order.indexOf(value); return index < 0 ? order.length : index; };
const sorters = {
  status: (a, b) => rankBy(STATUSES)(a) - rankBy(STATUSES)(b),
  voice: (a, b) => rankBy(VOICE_TYPES)(a) - rankBy(VOICE_TYPES)(b),
  region: (a, b) => rankBy(REGION_ORDER)(a) - rankBy(REGION_ORDER)(b) || String(a).localeCompare(String(b), 'th'),
  month: (a, b) => a - b,
  year: (a, b) => b - a, // newest year first
  office: (a, b) => String(a).localeCompare(String(b), 'th'),
};
// Years are stored as ค.ศ. (from created_at) but shown as พ.ศ.
const labels = { month: value => THAI_MONTHS[value - 1] ?? String(value), year: value => String(value + 543) };

/** Options come only from values present in the dataset. */
export function deriveFilterOptions(records) {
  const options = Object.fromEntries(FILTER_FIELDS.map(({ key, field }) => {
    const values = [...new Set(records.map(record => record[field]))].sort(sorters[key]);
    return [key, values.map(value => ({ value, label: labels[key]?.(value) ?? String(value) }))];
  }));
  // Offices remember their region so the dropdown can follow the region filter; grouped north → south.
  const officeRegion = new Map(records.map(record => [record.pea_office, record.region]));
  options.office = [...officeRegion].map(([value, region]) => ({ value, label: value, region }))
    .sort((a, b) => sorters.region(a.region, b.region) || sorters.office(a.value, b.value));
  return options;
}

/** Offices the dropdown should list for the chosen regions (all offices when no region is chosen). */
export const officesForRegions = (officeOptions, regions) => regions.length ? officeOptions.filter(option => regions.includes(option.region)) : officeOptions;

/** Selected offices that do not belong to any selected region. */
export function mismatchedOffices(filters, officeOptions) {
  const allowed = new Set(officesForRegions(officeOptions, filters.region).map(option => option.value));
  return filters.office.filter(office => !allowed.has(office));
}

/** Keeps only known keys, drops duplicates and orders values so equal selections compare equal. */
export function normalizeFilters(filters) {
  return Object.freeze(Object.fromEntries(ALL_FILTER_FIELDS.map(({ key }) =>
    [key, Object.freeze([...new Set(filters?.[key] ?? [])].sort(sorters[key]))])));
}

export const sameFilters = (a, b) => ALL_FILTER_FIELDS.every(({ key }) => a[key].length === b[key].length && a[key].every((value, index) => value === b[key][index]));

/** Values within one filter are OR-ed; different filters are AND-ed. */
export function applyFilters(records, filters, fields = FILTER_FIELDS) {
  const active = fields.filter(({ key }) => filters[key]?.length).map(({ key, field }) => [field, new Set(filters[key])]);
  if (!active.length) return records;
  return records.filter(record => active.every(([field, values]) => values.has(record[field])));
}
