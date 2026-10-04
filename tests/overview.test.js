import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseComplaints } from '../src/data/csv.js';
import { aggregateOverview } from '../src/data/overview.js';
const records = parseComplaints(await readFile(new URL('../public/data/complaints.csv', import.meta.url), 'utf8')).records;
const sum = rows => rows.reduce((total, row) => total + row.count, 0);
test('every overview total reconciles to the CSV, including office stacks', () => {
 const data = aggregateOverview(records);
 assert.equal(data.total, records.length);
 assert.equal(data.closed.total, records.filter(row => row.status === 'ปิด').length);
 assert.equal(data.pending.total + data.closed.total, data.total);
 for(const rows of [data.regions,data.voices,data.offices]) assert.equal(sum(rows),data.total);
 for(const group of [data.closed,data.pending]) { assert.equal(sum(group.sla),group.total); assert.equal(group.percentage,group.total / data.total * 100); }
 for(const office of data.offices) assert.equal(sum(office.groups),office.count);
});
test('uneven sample proves group-specific percentage denominators and new-request inclusion', () => {
 const base=records[0]; const data=aggregateOverview([
 {...base,status:'ปิด',sla_status:'เกินกำหนด'},
 {...base,status:'ปิด',sla_status:'ภายในกำหนด'},
 {...base,status:'รอดำเนินการ',sla_status:'ใกล้ครบกำหนด'},
 {...base,status:'กำลังดำเนินการ',sla_status:'ภายในกำหนด'},
 {...base,status:'กำลังดำเนินการ',sla_status:'ภายในกำหนด'},
 ]);
 assert.equal(data.closed.percentage,40);assert.equal(data.pending.percentage,60);
 assert.equal(data.closed.sla[0].percentage,50);
 assert.ok(Math.abs(data.pending.sla[0].percentage - 100/3) < 1e-10);
});
test('empty, all closed and all pending datasets have safe denominators',()=>{
 for(const subset of [[],records.filter(row=>row.status==='ปิด'),records.filter(row=>row.status!=='ปิด')]){
 const data=aggregateOverview(subset);assert.ok(!JSON.stringify(data).includes('null'));
 assert.equal(data.closed.total+data.pending.total,subset.length);
 }
 assert.equal(aggregateOverview([]).closed.percentage,0);
});
test('adding one CSV record changes all relevant overview aggregates',()=>{
 const before=aggregateOverview(records); const added={...records[0],complaint_id:'extra'};
 const after=aggregateOverview([...records,added]);assert.equal(after.total,before.total+1);
 for(const [key,field] of [['regions','region'],['voices','voice_type_level1'],['offices','pea_office']])assert.equal(after[key].find(row=>row.value===added[field]).count,before[key].find(row=>row.value===added[field]).count+1);
});

test('donut cross-selections intersect and all aggregates use the selected rows', async () => {
 const { selectOverviewRecords } = await import('../src/data/overview.js');
 const sample=records[0];
 for (const selection of [{region:sample.region,voice:null},{region:null,voice:sample.voice_type_level1},{region:sample.region,voice:sample.voice_type_level1},{region:'missing',voice:null},{region:null,voice:null}]) {
  const selected=selectOverviewRecords(records,selection);
  assert.equal(selected.length,records.filter(row=>(!selection.region||row.region===selection.region)&&(!selection.voice||row.voice_type_level1===selection.voice)).length);
  const data=aggregateOverview(selected);
  assert.equal(data.closed.total+data.pending.total,selected.length);
  for(const rows of [data.regions,data.voices,data.offices]) assert.equal(sum(rows),selected.length);
 }
});

test('donut groups areas into four regions and a region selection keeps only its areas', async () => {
  const { aggregateOverview, selectOverviewRecords } = await import('../src/data/overview.js');
  const { zoneOf } = await import('../src/data/filters.js');
  const rows = ['ก.1', 'ก.3', 'สนญ.', 'ฉ.2', 'ต.1', 'น.3', 'ไม่ระบุ'].map(region => ({ region, voice_type_level1: 'ร้องเรียน' }));
  const zones = Object.fromEntries(aggregateOverview(rows).zones.map(row => [row.value, row.count]));
  assert.deepEqual(zones, { 'ภาคกลาง': 3, 'ภาคตะวันออกเฉียงเหนือ': 1, 'ภาคใต้': 1, 'ภาคเหนือ': 1, 'ไม่ระบุ': 1 });
  assert.equal(zoneOf('สนญ.'), 'ภาคกลาง');
  const central = selectOverviewRecords(rows, { zone: 'ภาคกลาง', region: null, voice: null });
  assert.deepEqual(central.map(row => row.region), ['ก.1', 'ก.3', 'สนญ.']);
  assert.equal(selectOverviewRecords(rows, { zone: 'ภาคกลาง', region: 'ก.3', voice: null }).length, 1);
});
