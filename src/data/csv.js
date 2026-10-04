import { REQUIRED_FIELDS, normalizeRecord } from './schema.js';

/** RFC-style quoted CSV: BOM, CRLF/LF, commas, escaped quotes and embedded newlines. */
export function parseCsv(text) {
  if (typeof text !== 'string') throw Error('CSV must be text');
  text = text.replace(/^\uFEFF/, '');
  const rows = [];
  let row = [], field = '', quoted = false, endedQuote = false, line = 1, startLine = 1;
  const addField = () => { row.push(field); field = ''; endedQuote = false; };
  const addRow = () => {
    addField();
    if (row.some(value => value.trim())) rows.push({ cells: row, line: startLine });
    row = [];
  };
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else { quoted = false; endedQuote = true; }
      } else { field += char; if (char === '\n') line++; }
    } else if (char === ',') addField();
    else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++;
      addRow(); line++; startLine = line;
    } else if (char === '"') {
      if (field || endedQuote) throw Error(`CSV line ${line}: unexpected quote`);
      quoted = true;
    } else {
      if (endedQuote) throw Error(`CSV line ${line}: text after closing quote`);
      field += char;
    }
  }
  if (quoted) throw Error(`CSV line ${startLine}: unclosed quoted field`);
  if (field || row.length || endedQuote) addRow();
  return rows;
}

/** Invalid records are quarantined; structurally ambiguous CSV fails as a whole. */
export function parseComplaints(text) {
  const rows = parseCsv(text);
  if (!rows.length) throw Error('CSV header is missing');
  const headers = rows[0].cells.map(value => value.trim());
  if (new Set(headers).size !== headers.length || headers.some(value => !value)) throw Error('CSV headers must be nonempty and unique');
  const missing = REQUIRED_FIELDS.filter(field => !headers.includes(field));
  if (missing.length) throw Error(`Missing CSV columns: ${missing.join(', ')}`);
  const records = [], issues = [], ids = new Set(), officeRegions = new Map();
  for (const { cells, line } of rows.slice(1)) {
    try {
      if (cells.length !== headers.length) throw Error('column count differs from header');
      const record = normalizeRecord(Object.fromEntries(headers.map((header, index) => [header, cells[index]])));
      if (ids.has(record.complaint_id)) throw Error(`duplicate complaint_id: ${record.complaint_id}`);
      if (officeRegions.has(record.pea_office) && officeRegions.get(record.pea_office) !== record.region) throw Error('pea_office: conflicting region');
      ids.add(record.complaint_id); officeRegions.set(record.pea_office, record.region); records.push(record);
    } catch (error) { issues.push({ row: line, message: error.message }); }
  }
  return { records: Object.freeze(records), issues };
}
