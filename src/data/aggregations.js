import { HIERARCHY_FIELDS } from './schema.js';

export function percentage(count, denominator) {
  return denominator > 0 ? count / denominator * 100 : 0;
}

/** Always pass the same selected dataset to every aggregation. No global data access. */
export function countBy(records, field) {
  const counts = new Map();
  for (const record of records) counts.set(record[field], (counts.get(record[field]) ?? 0) + 1);
  return [...counts].map(([value, count]) => ({ value, count, percentage: percentage(count, records.length) }));
}

export function countByPair(records, first, second) {
  const groups = new Map();
  for (const record of records) {
    if (!groups.has(record[first])) groups.set(record[first], []);
    groups.get(record[first]).push(record);
  }
  return [...groups].map(([value, rows]) => ({ value, count: rows.length, groups: countBy(rows, second) }));
}

export function uniqueValues(records, field) {
  return [...new Set(records.map(record => record[field]))].sort((a, b) => typeof a === 'number' ? a - b : String(a).localeCompare(String(b), 'th'));
}

export function buildRegionOffices(records) {
  return new Map(uniqueValues(records, 'region').map(region => [region, uniqueValues(records.filter(record => record.region === region), 'pea_office')]));
}

/** Nodes are nested by full parent path, so repeated labels never merge across parents. */
export function buildHierarchy(records, depth = 0) {
  if (depth === HIERARCHY_FIELDS.length) return [];
  const field = HIERARCHY_FIELDS[depth];
  return uniqueValues(records, field).map(value => {
    const children = records.filter(record => record[field] === value);
    return { field, value, count: children.length, children: buildHierarchy(children, depth + 1) };
  });
}

export function hierarchyOptions(records, parentPath = []) {
  if (parentPath.length >= HIERARCHY_FIELDS.length) return [];
  return uniqueValues(records.filter(record => parentPath.every((value, index) => record[HIERARCHY_FIELDS[index]] === value)), HIERARCHY_FIELDS[parentPath.length]);
}

export function buildDataModel(records) {
  return {
    records,
    total: records.length,
    latestRecordDate: records.reduce((latest, row) => [latest, row.created_at, row.closed_at ?? ''].sort().at(-1), '') || null,
    filterOptions: Object.fromEntries(['status', 'month', 'year', 'voice_type_level1', 'region', 'pea_office', 'contact_channel'].map(field => [field, uniqueValues(records, field)])),
    regionOffices: buildRegionOffices(records),
    hierarchy: buildHierarchy(records),
  };
}
