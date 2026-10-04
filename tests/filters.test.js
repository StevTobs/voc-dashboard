import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseComplaints } from '../src/data/csv.js';
import { aggregateOverview } from '../src/data/overview.js';
import { DEFAULT_FILTERS, FILTER_FIELDS, OFFICE_FILTER, applyFilters, deriveFilterOptions, mismatchedOffices, normalizeFilters, officesForRegions } from '../src/data/filters.js';

const records = parseComplaints(await readFile(new URL('../public/data/complaints.csv', import.meta.url), 'utf8')).records;
const options = deriveFilterOptions(records);
const values = key => options[key].map(option => option.value);
const sum = rows => rows.reduce((total, row) => total + row.count, 0);
const run = partial => applyFilters(records, normalizeFilters({ ...DEFAULT_FILTERS, ...partial }));
const expected = partial => records.filter(record => FILTER_FIELDS.every(({ key, field }) => !partial[key]?.length || partial[key].includes(record[field])));

/** Every aggregate on the overview must come from the same rows and reconcile with them. */
function assertConsistent(rows) {
  const data = aggregateOverview(rows);
  assert.equal(data.total, rows.length);
  assert.equal(data.closed.total + data.pending.total, data.total);
  for (const group of [data.regions, data.voices, data.offices, data.regionGroups]) assert.equal(sum(group), data.total);
  for (const group of [data.closed, data.pending]) assert.equal(sum(group.sla), group.total);
  if (data.total) {
    for (const group of [data.regions, data.voices]) assert.ok(Math.abs(group.reduce((total, row) => total + row.percentage, 0) - 100) < 1e-9);
    assert.ok(Math.abs(data.closed.percentage + data.pending.percentage - 100) < 1e-9);
  }
  return data;
}

test('options are derived from the dataset', () => {
  for (const { key, field } of FILTER_FIELDS) assert.deepEqual(new Set(values(key)), new Set(records.map(record => record[field])));
  assert.ok(values('year').length >= 2 && values('month').length >= 2, 'fixture needs several years and months');
});

const cases = [
  ['A. one year', () => ({ year: values('year').slice(0, 1) })],
  ['B. several years', () => ({ year: values('year').slice(0, 2) })],
  ['C. one month', () => ({ month: values('month').slice(0, 1) })],
  ['D. several months', () => ({ month: values('month').slice(0, 3) })],
  ['E. one voice type', () => ({ voice: values('voice').slice(0, 1) })],
  ['F. several voice types', () => ({ voice: values('voice').slice(0, 3) })],
  ['G. one region', () => ({ region: values('region').slice(0, 1) })],
  ['H. several regions', () => ({ region: values('region').slice(0, 2) })],
  ['multiple statuses', () => ({ status: values('status').slice(0, 2) })],
  ['I. several filters together', () => ({ year: values('year').slice(-1), month: values('month').slice(0, 6), voice: values('voice').slice(0, 2), region: values('region').slice(0, 3), status: values('status').slice(1) })],
];
for (const [name, build] of cases) test(name, () => {
  const partial = build();
  const rows = run(partial);
  assert.deepEqual(rows, expected(partial));
  assert.ok(rows.length > 0 && rows.length < records.length, 'filter should narrow the data');
  assertConsistent(rows);
});

test('J. reset restores the full dataset', () => {
  assert.equal(applyFilters(records, DEFAULT_FILTERS), records);
  assert.equal(run({}).length, records.length);
  assertConsistent(run({}));
});

test('K. a filter with no matches yields empty, zeroed aggregates', () => {
  const rows = run({ year: [1900] });
  assert.equal(rows.length, 0);
  const data = assertConsistent(rows);
  assert.equal(data.closed.percentage, 0);
  assert.equal(data.pending.percentage, 0);
});

test('selecting every option is the same as ทั้งหมด, and filters combine with AND', () => {
  assert.equal(run({ region: values('region') }).length, records.length);
  const both = run({ region: values('region').slice(0, 1), voice: values('voice').slice(0, 1) });
  assert.ok(both.length <= run({ region: values('region').slice(0, 1) }).length);
  assert.ok(both.every(record => record.region === values('region')[0] && record.voice_type_level1 === values('voice')[0]));
});

test('การไฟฟ้า options come from pea_office and follow the region filter', () => {
  assert.deepEqual(new Set(options.office.map(option => option.value)), new Set(records.map(record => record.pea_office)));
  const region = values('region')[0];
  const inRegion = officesForRegions(options.office, [region]);
  assert.deepEqual(new Set(inRegion.map(option => option.value)), new Set(records.filter(record => record.region === region).map(record => record.pea_office)));
});

test('การไฟฟ้า narrows the detail dataset and reports offices outside the chosen region', () => {
  const [north, south] = values('region');
  const northOffice = officesForRegions(options.office, [north])[0].value;
  const filters = normalizeFilters({ ...DEFAULT_FILTERS, region: [north], office: [northOffice] });
  const detail = applyFilters(applyFilters(records, filters), filters, [OFFICE_FILTER]);
  assert.deepEqual(detail, records.filter(record => record.region === north && record.pea_office === northOffice));
  assert.deepEqual(mismatchedOffices(filters, options.office), []);
  assert.deepEqual(mismatchedOffices({ ...filters, region: [south] }, options.office), [northOffice]);
  assert.deepEqual(mismatchedOffices({ ...filters, region: [] }, options.office), []);
});
