import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseCsv, parseComplaints } from '../src/data/csv.js';
import { normalizeRecord, REQUIRED_FIELDS, VOICE_TYPES } from '../src/data/schema.js';
import { buildDataModel, countBy, countByPair, percentage, hierarchyOptions } from '../src/data/aggregations.js';
import { loadComplaints } from '../src/data/loader.js';

const csv = await readFile(new URL('../public/data/complaints.csv', import.meta.url), 'utf8');
const source = parseComplaints(csv);
const sample = Object.fromEntries(REQUIRED_FIELDS.map((field, i) => [field, parseCsv(csv)[1].cells[i]]));
const serialize = rows => [REQUIRED_FIELDS, ...rows.map(row => REQUIRED_FIELDS.map(field => row[field] ?? ''))].map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\r\n');

test('fixture covers all categories, calendar months, regions, offices, hierarchy and SLA', () => {
  assert.equal(source.issues.length, 0);
  const model = buildDataModel(source.records);
  assert.equal(model.total, parseCsv(csv).length - 1);
  assert.equal(model.filterOptions.year.length, 3);
  assert.equal(model.filterOptions.month.length, 12);
  assert.equal(model.filterOptions.region.length, 5);
  assert.equal(model.filterOptions.status.length, 3);
  assert.deepEqual(new Set(model.filterOptions.voice_type_level1), new Set(VOICE_TYPES));
  assert.equal(countBy(source.records, 'sla_status').length, 3);
  for (const offices of model.regionOffices.values()) assert.ok(offices.length >= 2);
  for (const node of model.hierarchy) assert.ok(node.children.length >= 2);
  assert.equal(typeof source.records[0].year, 'number');
  assert.equal(source.records[0].closed_at, null);
});

test('CSV supports BOM, CRLF, escaped quotes, comma and newline in values', () => {
  const row = { ...sample, contact_channel: 'เว็บ, "ลูกค้า"\nออนไลน์' };
  const parsed = parseComplaints('\uFEFF' + serialize([row]) + '\r\n\r\n');
  assert.equal(parsed.issues.length, 0);
  assert.equal(parsed.records[0].contact_channel, row.contact_channel);
});

test('structural errors fail safely; header-only CSV is a valid empty dataset', () => {
  for (const text of ['', 'x,y\n1,2', 'x,x', '"unclosed', '"x"oops', 'ab"c']) assert.throws(() => parseComplaints(text));
  assert.deepEqual(parseComplaints(REQUIRED_FIELDS.join(',')).records, []);
});

test('invalid rows, duplicates and conflicting office relationships are quarantined', () => {
  const parsed = parseComplaints(serialize([
    sample,
    sample,
    { ...sample, complaint_id: 'bad-date', created_at: '2025-02-30' },
    { ...sample, complaint_id: 'missing-region', region: '' },
    { ...sample, complaint_id: 'bad-region', region: 'Another region' },
    { ...sample, complaint_id: 'valid-second', contact_channel: '  เว็บไซต์  ' },
  ]));
  assert.equal(parsed.records.length, 2);
  assert.equal(parsed.issues.length, 4);
  assert.equal(parsed.issues[0].row, 3);
  assert.equal(parsed.records[1].contact_channel, 'เว็บไซต์');
  assert.equal(parseComplaints(serialize([sample]) + '\nshort,row').issues.length, 1);
});

test('date, enum, year/month and closure invariants', () => {
  for (const patch of [
    { status: 'unknown' }, { month: '13' }, { year: '2567' },
    { voice_type_level1: 'unknown' }, { sla_status: 'unknown' },
    { status: 'ปิดคำร้อง', closed_at: '' }, { closed_at: '2024-01-02' },
    { status: 'ปิดคำร้อง', closed_at: '2023-12-31' },
    { status: 'ปิดคำร้อง', closed_at: '2024-01-02', sla_status: 'ใกล้ครบกำหนด' },
  ]) assert.throws(() => normalizeRecord({ ...sample, ...patch }));
  assert.equal(normalizeRecord({ ...sample, created_at: '2024-02-29', month: '02' }).month, 2);
});

test('shared aggregations reconcile and empty denominators never yield NaN', () => {
  const subset = source.records.filter(row => row.year === 2025);
  const groups = countBy(subset, 'voice_type_level1');
  assert.equal(groups.reduce((sum, group) => sum + group.count, 0), subset.length);
  assert.ok(Math.abs(groups.reduce((sum, group) => sum + group.percentage, 0) - 100) < 1e-8);
  for (const group of countByPair(subset, 'region', 'voice_type_level1')) assert.equal(group.count, group.groups.reduce((sum, item) => sum + item.count, 0));
  assert.equal(percentage(0, 0), 0);
  assert.deepEqual(countBy([], 'status'), []);
  assert.equal(buildDataModel([]).latestRecordDate, null);
});

test('hierarchy options stay within their parent path', () => {
  const path = ['ร้องเรียน', 'คุณภาพไฟฟ้า'];
  const expected = new Set(source.records.filter(row => row.voice_type_level1 === path[0] && row.topic_level2 === path[1]).map(row => row.issue_level3));
  assert.deepEqual(new Set(hierarchyOptions(source.records, path)), expected);
  assert.deepEqual(hierarchyOptions(source.records, ['missing']), []);
  assert.deepEqual(hierarchyOptions(source.records, ['a', 'b', 'c', 'd']), []);
});

test('loader reads changed CSV, propagates HTTP/schema errors and uses no-store', async () => {
  let payload = serialize([sample]);
  const fetcher = async (url, options) => {
    assert.equal(url, '/data/complaints.csv'); assert.equal(options.cache, 'no-store');
    return { ok: true, text: async () => payload };
  };
  assert.equal((await loadComplaints({ fetcher })).records.length, 1);
  payload = serialize([sample, { ...sample, complaint_id: 'new-id' }]);
  assert.equal((await loadComplaints({ fetcher })).records.length, 2);
  await assert.rejects(loadComplaints({ fetcher: async () => ({ ok: false, status: 404 }) }), /404/);
  await assert.rejects(loadComplaints({ fetcher: async () => ({ ok: true, text: async () => '<html>fallback</html>' }) }), /Missing CSV columns/);
});
