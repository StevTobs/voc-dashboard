import { countBy, countByPair, percentage } from './aggregations.js';
import { zoneOf } from './filters.js';
import { CLOSED_STATUS } from './schema.js';

/** All overview metrics use this one dataset. New/unclosed requests belong to pending. */
export function aggregateOverview(records) {
  const total = records.length;
  function summarize(rows) {
    return { total: rows.length, percentage: percentage(rows.length, total), sla: countBy(rows, 'sla_status') };
  }
  return {
    total,
    closed: summarize(records.filter(row => row.status === CLOSED_STATUS)),
    // รอดำเนินการ, กำลังดำเนินการ and ส่งต่อ all belong to the อยู่ระหว่างดำเนินการ box.
    pending: summarize(records.filter(row => row.status !== CLOSED_STATUS)),
    regions: countBy(records, 'region'),
    zones: countBy(records.map(row => ({ zone: zoneOf(row.region) })), 'zone'),
    voices: countBy(records, 'voice_type_level1'),
    regionGroups: countByPair(records, 'region', 'voice_type_level1'),
    offices: countByPair(records, 'pea_office', 'voice_type_level1'),
  };
}

export const numberLabel = value => value == null ? '—' : value.toLocaleString('th-TH');
export const percentLabel = value => value == null ? '—%' : `${value.toLocaleString('th-TH', { maximumFractionDigits: 1 })}%`;

/** Donut/bar selections intersect; null means all values in that dimension. zone is the ภาค picked on the donut. */
export function selectOverviewRecords(records, selection) {
  return records.filter(row => (!selection.zone || zoneOf(row.region) === selection.zone)
    && (!selection.region || row.region === selection.region)
    && (!selection.voice || row.voice_type_level1 === selection.voice));
}
