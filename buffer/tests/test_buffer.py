import json
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from datetime import date, datetime, timezone
from pathlib import Path

from buffer.core import Buffer, compare
from buffer.server import serve
from buffer.sources import SqliteSource
from buffer.transform import DASHBOARD_FIELDS, build_records, local_date, parse_datetime, sla_status

PACKAGE = Path(__file__).resolve().parents[1]
MAPPING = json.loads((PACKAGE / "mapping.json").read_text("utf-8"))
DEV_DB = PACKAGE.parent / "dev.db"
AS_OF = datetime(2026, 9, 30, 5, 0, tzinfo=timezone.utc)
RULES = MAPPING["sla"]


def tables(**overrides):
    base = {
        "voc_master": [{"id": "m1", "voc_no": "C-1", "status": "COMPLETED", "created_at": "2026-08-01T10:00:00", "updated_at": "2026-08-20T10:00:00",
                        "is_deleted": 0, "request_type": "t-req", "topic": "t-topic", "issue": "i1", "sub_issue": "t-sub"}],
        "voc_detail": [{"voc_master_id": "m1", "request_pea": "L01201", "main_channel": "ch1", "completed_date": "2026-08-10T09:00:00.929000"}],
        "voc_status": [{"id": 1, "status_en": "COMPLETED", "group_status_th": "ปิด"}, {"id": 2, "status_en": "IN_PROGRESS", "group_status_th": "กำลังดำเนินการ"},
                       {"id": 3, "status_en": "CANCELLED", "group_status_th": "ยกเลิกคำร้อง"}],
        "voc_channels": [{"id": "ch1", "name": "Call Center"}],
        "voc_issues": [{"id": "i1", "name": "ค่าไฟฟ้าผิดปกติ"}],
        "voc_types": [{"id": "t-req", "name": "คำร้องเรียน"}, {"id": "t-topic", "name": "บริการ"}, {"id": "t-sub", "name": "บิลผิด"}],
        "pea_office": [{"name": "กฟจ.ยะลา", "region_group": "L01201"}],
    }
    base.update(overrides)
    return base


class TransformTest(unittest.TestCase):
    def test_maps_every_dashboard_column(self):
        mapping = {**MAPPING, "voice_type": {"map": {"คำร้องเรียน": "ร้องเรียน"}}}
        records, report = build_records(tables(), mapping, AS_OF)
        self.assertEqual(records, [{
            "complaint_id": "C-1", "created_at": "2026-08-01", "closed_at": "2026-08-10", "status": "ปิดคำร้อง", "year": 2026, "month": 8,
            "region": "ต.3", "pea_office": "กฟจ.ยะลา", "contact_channel": "Call Center", "voice_type_level1": "ร้องเรียน",
            "topic_level2": "บริการ", "issue_level3": "ค่าไฟฟ้าผิดปกติ", "subissue_level4": "บิลผิด", "sla_status": "ภายในกำหนด", "region_name": "ภาคใต้"}])
        self.assertEqual(report["unmapped"], {})
        self.assertTrue(set(DASHBOARD_FIELDS) <= set(records[0]))

    def test_unmapped_values_become_unknown_and_are_reported(self):
        records, report = build_records(tables(voc_detail=[]), MAPPING, AS_OF)
        row = records[0]
        self.assertEqual((row["region"], row["pea_office"], row["voice_type_level1"], row["region_name"]), ("ไม่ระบุ",) * 4)
        self.assertEqual(report["unmapped"]["voice_type_level1"]["rows"], 1)
        self.assertEqual(report["adjusted"], {"ปิดแล้วแต่ไม่มี completed_date (ใช้ updated_at)": 1})
        self.assertEqual(row["closed_at"], "2026-08-20")

    def test_region_comes_from_pea_office_region_group(self):
        # request_pea L01201 → pea_office row whose region_group is L01201 → letter L → ต.3
        records, _ = build_records(tables(pea_office=[{"name": "กฟจ.ยะลา", "region_group": "l01201 "}]), MAPPING, AS_OF)
        self.assertEqual((records[0]["pea_office"], records[0]["region"]), ("กฟจ.ยะลา", "ต.3"))
        # no pea_office row → region is unknown even though request_pea starts with a known letter
        records, report = build_records(tables(pea_office=[]), MAPPING, AS_OF)
        self.assertEqual((records[0]["pea_office"], records[0]["region"]), ("ไม่ระบุ", "ไม่ระบุ"))
        self.assertEqual(report["unmapped"]["region"]["top_values"], [["L01201 (ไม่พบใน pea_office)", 1]])

    def test_excluded_and_deleted_rows_are_skipped(self):
        master = tables()["voc_master"][0]
        records, report = build_records(tables(voc_master=[{**master, "status": "CANCELLED"}, {**master, "id": "m2", "is_deleted": 1}]), MAPPING, AS_OF)
        self.assertEqual(records, [])
        self.assertEqual(report["skipped"], {"สถานะ ยกเลิกคำร้อง": 1, "ถูกลบ (is_deleted)": 1})

    def test_open_requests_get_sla_from_age(self):
        master = tables()["voc_master"][0]
        rows = [{**master, "id": f"m{days}", "voc_no": f"C-{days}", "status": "IN_PROGRESS", "created_at": f"2026-09-{30 - days:02d}T08:00:00"} for days in (5, 15, 29)]
        rows.append({**master, "id": "old", "voc_no": "C-old", "status": "IN_PROGRESS", "created_at": "2026-08-01T08:00:00"})
        records, _ = build_records(tables(voc_master=rows), MAPPING, AS_OF)
        self.assertEqual([r["sla_status"] for r in records], ["ภายในกำหนด", "ใกล้ครบกำหนด", "ใกล้ครบกำหนด", "เกินกำหนด"])
        self.assertTrue(all(r["closed_at"] == "" for r in records))

    def test_sla_and_dates(self):
        self.assertEqual(sla_status(date(2026, 1, 1), date(2026, 2, 5), date(2026, 3, 1), RULES), "เกินกำหนด")
        self.assertEqual(sla_status(date(2026, 1, 1), date(2026, 1, 31), date(2026, 3, 1), RULES), "ภายในกำหนด")
        from zoneinfo import ZoneInfo
        bangkok = ZoneInfo("Asia/Bangkok")
        self.assertEqual(local_date("2026-01-31T20:00:00+00:00", bangkok), date(2026, 2, 1))
        self.assertEqual(local_date("2026-01-31T20:00:00", bangkok), date(2026, 1, 31))
        self.assertIsNotNone(parse_datetime("2026-09-01T03:27:37.9290"))
        self.assertIsNone(parse_datetime("not a date"))

    def test_compare_reports_lag(self):
        health = lambda latest: {"state": "online", "tables": {"voc_master": {"latest_update": latest}}}
        result = compare(health("2026-10-01T00:00:00"), health("2026-10-03T00:00:00+07:00"))
        self.assertEqual(result["internal_behind_seconds"], 2 * 86400)
        self.assertIsNone(compare(health("x"), {"state": "offline"}))


@unittest.skipUnless(DEV_DB.exists(), "dev.db not present")
class BufferTest(unittest.TestCase):
    def setUp(self):
        self.cache = tempfile.TemporaryDirectory()
        self.buffer = Buffer(SqliteSource(DEV_DB), MAPPING, Path(self.cache.name), internal=SqliteSource(DEV_DB))

    def tearDown(self):
        self.cache.cleanup()

    def test_refresh_writes_snapshot_and_survives_a_failed_refresh(self):
        self.assertTrue(self.buffer.refresh())
        first = self.buffer.snapshot
        self.assertGreater(first.rows, 0)
        self.assertTrue((Path(self.cache.name) / "complaints.csv").exists())
        self.buffer.source = SqliteSource(Path(self.cache.name) / "missing.db")
        self.assertFalse(self.buffer.refresh())
        status = self.buffer.status()
        self.assertEqual(self.buffer.snapshot.id, first.id)
        self.assertTrue(status["snapshot"]["stale"])
        self.assertIn("ไม่พบไฟล์", status["last_refresh"]["error"])
        # a restarted buffer serves the cached snapshot before its first refresh
        self.assertEqual(Buffer(self.buffer.source, MAPPING, Path(self.cache.name)).snapshot.id, first.id)

    def test_health_reports_internal_online_and_external_not_configured(self):
        health = self.buffer.check_health()
        self.assertEqual(health["internal"]["state"], "online")
        self.assertEqual(health["external"]["state"], "not_configured")
        self.assertIn("voc_master", health["internal"]["tables"])

    def test_http_api(self):
        server = serve(self.buffer, 0)
        threading.Thread(target=server.serve_forever, daemon=True).start()
        base = f"http://127.0.0.1:{server.server_address[1]}"
        try:
            with self.assertRaises(urllib.error.HTTPError) as missing:
                urllib.request.urlopen(f"{base}/api/complaints.csv")
            self.assertEqual(missing.exception.code, 503)
            with self.assertRaises(urllib.error.HTTPError) as forbidden:
                urllib.request.urlopen(urllib.request.Request(f"{base}/api/refresh", method="POST"))
            self.assertEqual(forbidden.exception.code, 403)
            refreshed = json.load(urllib.request.urlopen(urllib.request.Request(f"{base}/api/refresh", method="POST", headers={"X-Buffer-Refresh": "1"})))
            self.assertTrue(refreshed["last_refresh"]["ok"])
            response = urllib.request.urlopen(f"{base}/api/complaints.csv")
            self.assertEqual(response.headers["X-Snapshot-Id"], refreshed["snapshot"]["id"])
            self.assertTrue(response.read().decode("utf-8").startswith("complaint_id,"))
        finally:
            server.shutdown()
            server.server_close()


if __name__ == "__main__":
    unittest.main()
