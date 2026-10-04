# PEA VOC data buffer

ตัวกลางระหว่างฐานข้อมูล VOC กับ dashboard

```
ฐานข้อมูลภายใน (dev.db) ─┐                       ┌─ GET /api/complaints.csv → dashboard
                         ├─ sources → transform ─┤      (คอลัมน์เดียวกับ public/data/complaints.csv)
ฐานข้อมูลภายนอก (PostgreSQL)┘   (mapping.json)    └─ snapshot ล่าสุด (buffer/cache/)
            ▲
            └── health check ทุก 60 วินาที → GET /api/status → แถบสถานะบน dashboard
```

| ไฟล์ | หน้าที่ |
|---|---|
| `sources.py` | อ่านตารางจาก dev.db (เปิดแบบอ่านอย่างเดียว) หรือ PostgreSQL (session read-only) และตรวจสถานะ |
| `mapping.json` | กฎแปลงค่า เช่น สถานะ เขต/ภาค เกณฑ์ SLA ประเภทเสียง แก้ได้โดยไม่ต้องแก้โค้ด |
| `transform.py` | แปลงแถวดิบเป็นคอลัมน์ของ dashboard และสร้างรายงานค่าที่จับคู่ไม่ได้ |
| `core.py` | เก็บ snapshot ดึงข้อมูลใหม่ตามรอบ ตรวจสถานะภายใน/ภายนอก และเทียบความทันกันของข้อมูล |
| `server.py` | HTTP API บน 127.0.0.1 |

## คอลัมน์ที่ต้องประมวลผล

| คอลัมน์ dashboard | มาจาก |
|---|---|
| `status` | `voc_master.status` → `voc_status.group_status_th` → `mapping.status` (ยกเลิกคำร้องไม่ถูกส่งไป) |
| `created_at`, `year`, `month` | `voc_master.created_at` แปลงเป็นวันที่เวลาไทย |
| `closed_at` | `voc_detail.completed_date` (ถ้าว่างใช้ `voc_master.updated_at` และนับในรายงาน) |
| `region` (เขต เช่น น.1), `region_name` (ภาค) | `voc_detail.request_pea` → แถวใน `pea_office` ที่ `region_group` ตรงกัน → อักษรตัวแรกของ `region_group` → `mapping.areas` |
| `pea_office` | แถว `pea_office` เดียวกัน → `pea_office.name` |
| `contact_channel` | `voc_detail.main_channel` → `voc_channels.name` |
| `voice_type_level1` | `voc_master.request_type` → `voc_types.name` → `mapping.voice_type.map` (ยังว่าง → `ไม่ระบุ`) |
| `topic_level2` / `issue_level3` / `subissue_level4` | `topic` / `issue` / `sub_issue` → `voc_types` / `voc_issues` |
| `sla_status` | จำนวนวันจากวันรับเรื่องถึงวันปิด (หรือถึงวันที่ดึงข้อมูล) เทียบกับ `mapping.sla` |

ค่าที่จับคู่ไม่ได้จะเป็น `ไม่ระบุ` ไม่ทิ้งแถว ยอดรวมจึงยังตรงกับฐานข้อมูล ดูรายการได้จาก `report.unmapped` ใน `/api/status`
หรือรัน `python3 -m buffer --once /tmp/check.csv`

## รัน

```sh
npm run buffer          # buffer ใช้ dev.db ที่ root ของ repo, port 8765
npm run dev:buffer      # dashboard อ่านข้อมูลจาก buffer (อีก Terminal หนึ่ง)
npm run dev             # dashboard แบบเดิม อ่าน Mock CSV
```

ฐานข้อมูลจริง (ภายนอก) ใช้โค้ดเชื่อมต่อ, `.env` และ `.venv` ของโปรเจกต์ `pea_voc_db`
(ค่าเริ่มต้น `~/Desktop/pea_voc_db` เปลี่ยนได้ด้วย `PEA_VOC_DB_DIR`)

```sh
~/Desktop/pea_voc_db/.venv/bin/python -m buffer --check-external     # ข้อมูลจาก dev.db + ตรวจสถานะฐานข้อมูลจริง
~/Desktop/pea_voc_db/.venv/bin/python -m buffer --source external    # ข้อมูลจากฐานข้อมูลจริง
```

- ตรวจเครือข่ายที่อนุญาต (`netguard`) ก่อนเชื่อมต่อและก่อนทุกคำสั่ง
- SSH ตรวจ host key กับ `~/.ssh/known_hosts` session เป็น read-only และมี `statement_timeout`
- รหัสผ่านกรอกใน Terminal ตอนเริ่ม ใช้แล้วทิ้ง ถ้าการเชื่อมต่อหลุด สถานะจะเป็น "เชื่อมต่อไม่ได้" และต้องเริ่ม buffer ใหม่
- buffer ใช้ snapshot ล่าสุดต่อเมื่อดึงข้อมูลไม่สำเร็จ และแจ้ง "ข้อมูลอาจไม่เป็นปัจจุบัน"

### Publish บน Windows (http://<เครื่องนี้>/test/voc-dashboard/)

1. สร้าง `.env` ที่ root ของ repo นี้ (ถูก .gitignore):
   ```
   PEA_VOC_DB_DIR=C:/Users/<user>/Desktop/DEV-TOP/pea-voc-database-query
   BUFFER_SSH_PASSWORD=...
   BUFFER_DB_PASSWORD=...
   ```
   ถ้าไม่ใส่รหัสผ่าน buffer จะถามใน Terminal เหมือนเดิม
2. `npm run build:publish` — build ให้ใช้ base `/test/voc-dashboard/` และอ่านข้อมูลจาก `/test/voc-dashboard/api/complaints.csv`
3. ดับเบิลคลิก `publish-buffer.bat` — เริ่ม buffer (`--source external`) และเริ่มใหม่อัตโนมัติถ้าการเชื่อมต่อหลุด
4. Caddy (`pea-voc-database-query/Caddyfile`) ส่ง `/test/voc-dashboard/api/*` ไป buffer และเสิร์ฟ `dist/` สำหรับ path อื่น

ตัวเลือกอื่น: `--refresh` (วินาที, ค่าเริ่มต้น 300), `--health` (60), `--port` (8765), `--db`, `--mapping`

## API

| | |
|---|---|
| `GET /api/complaints.csv` | snapshot ล่าสุด (header `X-Snapshot-Id`) |
| `GET /api/status` | แหล่งข้อมูล, snapshot, ผล refresh ล่าสุด, สถานะ `internal` / `external`, `comparison` (dev.db ตามหลังจริงเท่าไร) |
| `POST /api/refresh` | ดึงใหม่ทันที ต้องส่ง header `X-Buffer-Refresh: 1` |

## ทดสอบ

```sh
npm run test:buffer
```

`buffer/cache/` และ `*.db` อาจมีข้อมูลจริงขององค์กร ถูกใส่ใน `.gitignore` แล้ว
