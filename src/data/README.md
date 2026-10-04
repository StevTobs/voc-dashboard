# Round 2 data contract

Source: `public/data/complaints.csv` (UTF-8, one request per row). All records are synthetic; office labels and hierarchy terms are illustrative, not an authoritative PEA directory. The fixture has 720 requests across 2024–2026, every month, five area groups (including headquarters), ten offices, five channels and five voice types. It intentionally includes future dates as mock scenarios.

| CSV field | Normalized type | Rule |
| --- | --- | --- |
| complaint_id | string | Required, unique; duplicates are excluded after the first valid row |
| created_at | string | Valid Gregorian YYYY-MM-DD date, retained without timezone conversion |
| closed_at | string or null | Blank becomes null; required only when closed; cannot precede created_at |
| status | enum | ปิด / รอดำเนินการ / กำลังดำเนินการ / ส่งต่อ |
| year | number | Gregorian year; must match created_at |
| month | number | 1–12; must match created_at |
| region | string | Required area group |
| pea_office | string | Required office; one office label must map to one region |
| contact_channel | string | Required channel |
| voice_type_level1 | enum | ร้องเรียน / ข้อเสนอแนะ/ข้อคิดเห็น / แจ้งเหตุ / แจ้งเบาะแส / ชื่นชม |
| topic_level2 | string | Required child of Level 1 |
| issue_level3 | string | Required child of the full Level 1–2 path |
| subissue_level4 | string | Required child of the full Level 1–3 path |
| sla_status | enum | เกินกำหนด / ใกล้ครบกำหนด / ภายในกำหนด |

SLA is an explicit CSV snapshot category, not a calculation based on the current clock. Closed requests cannot have ใกล้ครบกำหนด. Business-specific deadline rules and mapping new requests into the future overview's pending group are deferred. Months/years describe creation dates, not closure dates. `latestRecordDate` is the maximum created/closed date in valid records, not a file modification timestamp.

## Loading and validation

`main.jsx` installs one `DataProvider` shared by both pages. On mount, `loader.js` fetches `${BASE_URL}data/complaints.csv` with `cache: no-store` and an AbortSignal. Refresh to reload an edited CSV; tab switching reuses the shared dataset. Production builds copy the CSV into `dist/data/complaints.csv`; rebuild/redeploy to publish source changes.

`csv.js` handles UTF-8 BOM, quoted commas/newlines, doubled quotes, CRLF/LF and blank lines. `schema.js` trims and Unicode-normalizes values, converts number/null types and checks dates/categories/relationships. Required or duplicate/missing headers and ambiguous quote syntax fail the whole load. Extra columns are ignored. Invalid rows, duplicate IDs and conflicting office mappings are skipped with source line diagnostics. The first valid office mapping wins. Validation does not silently repair contradictory records. Header-only CSV is a valid empty dataset; all-invalid data produces zero records plus warnings.

The existing note under the filters reports loading, error, accepted count and skipped-row count. The first row issue is visible, with all issues in the note's title and available via `useDashboardData().issues`. The heading shows the latest source-record date. KPI shells and charts remain placeholders for Round 3; filter controls remain disabled for their later round. No CSS/layout/font changes were made in Round 2.

## Shared API

- `types.d.ts`: `ComplaintRecord`, `DataIssue`, `CsvResult` interfaces; runtime schema in `schema.js` is the validation authority.
- `useDashboardData()`: status, error, issues, immutable records and memoized model.
- `buildDataModel(records)`: total, latestRecordDate, unique filter options, regionOffices Map and nested hierarchy.
- `countBy(records, field)`: counts and percentages relative to the supplied dataset.
- `countByPair(records, first, second)`: grouped counts; nested percentages use their parent group as denominator.
- `percentage(count, denominator)`: unrounded percentage, zero for an empty denominator; formatting belongs to the UI.
- `hierarchyOptions(records, parentPath)`: available children under exactly that path. Repeated child labels in different branches remain separate.

Future filters should create one selected dataset from these validated records and pass it to every KPI/chart aggregation. Filter options and mappings must come from CSV-derived model values, not from independently maintained lists. The hierarchy includes every voice type; later complaint-only views can pass a complaint subset. Cross-filter selections can use the existing record fields without adding a second data source.

## Tests and CSV edit check

Run `npm test` for parser, normalization, invalid-row handling, grouping/denominators, hierarchy, mapping, coverage and loader tests; run `npm run build` for the production build.

1. Run `npm run dev` and open either tab. The note reads `โหลด CSV แล้ว 720 รายการ` for the supplied fixture.
2. Copy one CSV data row, change its complaint_id to a new unique value and save. Refresh the browser: the accepted count increases to 721 on either page.
3. Remove that new row and refresh: the count returns to 720.
4. To inspect invalid data behavior, use a duplicate ID or invalid created_at instead: the accepted count stays unchanged and a skipped-row warning appears.
5. Keep only the header to test zero records, or temporarily rename the CSV to test load failure. Restore the source after testing.

Changing the CSV does not render charts or fill KPI cards in this round. The count/latest-date readout is the deliberate end-to-end proof that the app reads the file.

## Round 3 overview (supersedes placeholder notes above)

`aggregateOverview(records)` in `overview.js` is the only overview aggregation entry point. `Overview.jsx` passes its single shared provider dataset into it once and supplies the results to all overview components.

- Total: number of valid CSV records, across all five voice types.
- Closed (ปิดคำร้อง box): status ปิด. Pending (อยู่ระหว่างดำเนินการ box): รอดำเนินการ, กำลังดำเนินการ and ส่งต่อ. This partitions all records without dropping newly received requests.
- Group percentages: closed or pending count / all records × 100.
- SLA cards: count of each `sla_status` within the group; percentage denominator is that group's count. Empty denominators yield zero.
- Donuts: counts grouped by region or voice_type_level1; denominator is the total dataset.
- Office chart: counts by pea_office then voice_type_level1; all offices are included, with a linear count axis derived from the maximum office total. Tooltip percentages use the office's total. Horizontal scrolling supports additional offices without dropping records.
- Values are rounded only for display (percentages to one decimal); rounded slices can sum to 99.9% or 100.1%.
- The existing SLA deadline captions are reference labels. Actual bucket membership uses the explicit CSV sla_status snapshot; no date-based reclassification or new SLA policy is introduced.
- Empty loaded data shows zero KPI values and empty chart messages. Loading/errors show dashes instead of fabricated zeros. Invalid rows remain excluded by the existing loader.
- Charts accept optional `onSelect` callbacks for future work, but the overview does not supply them. Round 4 filters and Round 5 cross-filtering are not implemented.

Run `npm test` for reconciliation, uneven denominators, zero datasets and record-addition coverage. Run `npm run build` and `npm run dev` to inspect the page. Copy a CSV row with a new ID and refresh: its status/SLA, region, voice and office counts all increase together. Restore the row afterwards. Existing mock data has equal office totals; flat overall bar heights are expected, not hard-coded.
