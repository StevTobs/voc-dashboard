"""แปลงแถวดิบจากฐานข้อมูล VOC เป็นแถวตามคอลัมน์ของ dashboard (public/data/complaints.csv)

เป็นฟังก์ชันบริสุทธิ์: ไม่ต่อฐานข้อมูล ไม่อ่านไฟล์ ทดสอบได้ด้วยข้อมูลในหน่วยความจำ
"""
from __future__ import annotations

from collections import Counter
from datetime import date, datetime
from typing import Any, Dict, Iterable, List, Optional, Tuple
from zoneinfo import ZoneInfo

# ต้องตรงกับ REQUIRED_FIELDS ใน src/data/schema.js ส่วน region_name (ชื่อภาค) เป็นคอลัมน์เสริม (dashboard ข้ามคอลัมน์ที่ไม่รู้จัก)
DASHBOARD_FIELDS = [
    "complaint_id", "created_at", "closed_at", "status", "year", "month", "region", "pea_office",
    "contact_channel", "voice_type_level1", "topic_level2", "issue_level3", "subissue_level4", "sla_status",
]
OUTPUT_FIELDS = DASHBOARD_FIELDS + ["region_name"]
CLOSED = "ปิด"


def parse_datetime(value: Any) -> Optional[datetime]:
    """รับ datetime (psycopg) หรือข้อความ ISO 8601 (SQLite/CSV) คืน None ถ้าว่างหรืออ่านไม่ได้"""
    if value is None or value == "":
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, date):
        return datetime(value.year, value.month, value.day)
    text = str(value).strip().replace(" ", "T", 1)
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    try:
        return datetime.fromisoformat(text)
    except ValueError:
        # Python 3.9 อ่านเศษวินาทีได้เฉพาะ 3 หรือ 6 หลัก — ตัดเหลือระดับวินาทีแล้วลองใหม่
        head, dot, tail = text.partition(".")
        if not dot:
            return None
        offset = next((tail[i:] for i, ch in enumerate(tail) if ch in "+-"), "")
        try:
            return datetime.fromisoformat(head + offset)
        except ValueError:
            return None


def local_date(value: Any, tz: ZoneInfo) -> Optional[date]:
    """วันที่ตามเวลาไทย: ค่าที่มี timezone แปลงก่อน ค่าที่ไม่มีถือว่าเป็นเวลาท้องถิ่นแล้ว"""
    moment = parse_datetime(value)
    if moment is None:
        return None
    return (moment.astimezone(tz) if moment.tzinfo else moment).date()


def sla_status(created: date, closed: Optional[date], as_of: date, rules: Dict[str, int]) -> str:
    end = closed or as_of
    days = (end - created).days
    if days > rules["overdue_after_days"]:
        return "เกินกำหนด"
    if closed is None and days >= rules["due_soon_from_days"]:
        return "ใกล้ครบกำหนด"
    return "ภายในกำหนด"


def _index(rows: Iterable[Dict[str, Any]], key: str) -> Dict[Any, Dict[str, Any]]:
    index: Dict[Any, Dict[str, Any]] = {}
    for row in rows:
        index.setdefault(row.get(key), row)  # เก็บแถวแรก (voc_status มี status_en ซ้ำ)
    return index


def _truthy(value: Any) -> bool:
    return value in (True, 1, "1", "true", "t", "True")


def build_records(tables: Dict[str, List[Dict[str, Any]]], mapping: Dict[str, Any], as_of: datetime) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """คืน (records, report) — report บอกจำนวนแถวที่ข้ามและค่าที่จับคู่ไม่ได้ เพื่อให้ตรวจ mapping ได้"""
    tz = ZoneInfo(mapping.get("timezone", "Asia/Bangkok"))
    unknown = mapping.get("unknown", "ไม่ระบุ")
    today = (as_of.astimezone(tz) if as_of.tzinfo else as_of).date()
    status_by_code = _index(tables.get("voc_status", []), "status_en")
    detail_by_master = _index(tables.get("voc_detail", []), "voc_master_id")
    channel_name = {row["id"]: row["name"] for row in tables.get("voc_channels", [])}
    issue_name = {row["id"]: row["name"] for row in tables.get("voc_issues", [])}
    type_name = {row["id"]: row["name"] for row in tables.get("voc_types", [])}
    # voc_master.request_type อ้างถึง voc_request_types (ร้องเรียน, แจ้งเหตุ …) — dev.db เก่าไม่มีตารางนี้จึงตกไปที่ voc_types
    request_type_name = {row["id"]: row["name"] for row in tables.get("voc_request_types", [])}
    # topic → voc_topics, sub_issue → voc_sub_issues (issue → voc_issues); voc_types เป็นค่าสำรองของ dev.db เก่า
    topic_name = {**type_name, **{row["id"]: row["name"] for row in tables.get("voc_topics", [])}}
    sub_issue_name = {**type_name, **{row["id"]: row["name"] for row in tables.get("voc_sub_issues", [])}}
    # voc_detail.request_pea อ้างถึงแถวใน pea_office ผ่าน region_group
    office_by_group = {str(row["region_group"]).strip().upper(): row for row in tables.get("pea_office", []) if row.get("region_group")}
    # pea_office มีเฉพาะสาขา (กฟจ./กฟอ.) — รหัสสำนักงานใหญ่/การไฟฟ้าเขต (Z00000, A00000 …) ใช้ชื่อจาก voc_mas_department
    # ถ้ารหัสนั้นมีหลายหน่วยงานที่ชื่อต่างกัน (เช่น Z00000) ใช้ชื่อภาคแทน เพื่อไม่เลือกหน่วยงานใดหน่วยงานหนึ่งแบบสุ่ม
    dept_names: Dict[str, set] = {}
    for row in tables.get("voc_mas_department", []):
        code, name = str(row.get("pea_code") or "").strip().upper(), str(row.get("dept_short") or "").strip()
        if code and name and not _truthy(row.get("is_deleted")):
            dept_names.setdefault(code, set()).add(name)
    areas = {key: value for key, value in mapping["areas"].items() if not key.startswith("_")}
    # ชื่อภาคที่มีเขตเดียว (สำนักงานใหญ่) ใช้ได้เลย ภาคที่มีหลายเขตต้องระบุเขตด้วย
    areas_per_region = Counter(value["region"] for value in areas.values())
    area_label = lambda area: area["region"] if areas_per_region[area["region"]] == 1 else f"{area['region']} ({area['area']})"
    voice_map = mapping["voice_type"]["map"]
    status_map, excluded = mapping["status"]["map"], set(mapping["status"]["exclude"])

    records: List[Dict[str, Any]] = []
    skipped: Counter = Counter()
    unmapped: Dict[str, Counter] = {field: Counter() for field in ("status", "region", "pea_office", "contact_channel", "voice_type_level1", "topic_level2", "issue_level3", "subissue_level4")}
    adjusted: Counter = Counter()

    for master in tables.get("voc_master", []):
        if _truthy(master.get("is_deleted")):
            skipped["ถูกลบ (is_deleted)"] += 1
            continue
        group = (status_by_code.get(master.get("status")) or {}).get("group_status_th")
        if group in excluded:
            skipped[f"สถานะ {group}"] += 1
            continue
        status = status_map.get(group)
        if status is None:
            unmapped["status"][master.get("status") or "(ว่าง)"] += 1
            skipped["สถานะจับคู่ไม่ได้"] += 1
            continue
        created = local_date(master.get("created_at"), tz)
        if created is None:
            skipped["created_at ว่างหรืออ่านไม่ได้"] += 1
            continue

        detail = detail_by_master.get(master.get("id"), {})
        closed = None
        if status == CLOSED:
            closed = local_date(detail.get("completed_date"), tz)
            if closed is None:
                closed = local_date(master.get("updated_at"), tz) or created
                adjusted["ปิดแล้วแต่ไม่มี completed_date (ใช้ updated_at)"] += 1
            if closed < created:
                closed = created
                adjusted["completed_date ก่อน created_at (ใช้ created_at)"] += 1

        # พื้นที่มาจาก pea_office.region_group: request_pea → แถว pea_office → region_group → เขตใน mapping.areas
        # ไม่พบใน pea_office → ใช้อักษรตัวแรกของ request_pea เอง (รูปแบบรหัสเดียวกัน เช่น Z00000 → สนญ., A00000 → น.1)
        code = (detail.get("request_pea") or "").strip().upper()
        office_row = office_by_group.get(code)
        region_group = str(office_row["region_group"]).strip().upper() if office_row else code
        area = areas.get(region_group[:1]) if region_group else None
        if area is None:
            reason = f"{region_group} (ไม่มีใน mapping.areas)" if region_group else "(ไม่มี request_pea)"
            unmapped["region"][reason] += 1
        elif office_row is None:
            adjusted["พื้นที่จากอักษรแรกของ request_pea (ไม่พบใน pea_office)"] += 1
        # dashboard ถือว่าชื่อการไฟฟ้าหนึ่งชื่ออยู่ได้พื้นที่เดียว ชื่อสำรองจึงต้องผูกกับพื้นที่เสมอ
        office = office_row["name"] if office_row and office_row.get("name") else None
        if office is None and code in dept_names:
            names = dept_names[code]
            office = next(iter(names)) if len(names) == 1 else (area_label(area) if area else None)
        if office is None:
            unmapped["pea_office"][code or "(ว่าง)"] += 1
            office = f"{unknown} ({area['area']})" if area else unknown

        def lookup(names: Dict[Any, str], key: Any, field: str) -> str:
            name = names.get(key)
            if name is None:
                unmapped[field][key or "(ว่าง)"] += 1
            return name or unknown

        request_type = request_type_name.get(master.get("request_type")) or type_name.get(master.get("request_type"))
        voice = voice_map.get(request_type) if request_type else None
        if voice is None:
            unmapped["voice_type_level1"][request_type or master.get("request_type") or "(ว่าง)"] += 1

        records.append({
            "complaint_id": master.get("voc_no") or master["id"],
            "created_at": created.isoformat(),
            "closed_at": closed.isoformat() if closed else "",
            "status": status,
            "year": created.year,
            "month": created.month,
            # dashboard แสดงพื้นที่เป็นเขต (น.1 … สนญ.) ส่วนชื่อภาคเก็บไว้ใน region_name
            "region": area["area"] if area else unknown,
            "pea_office": office,
            "contact_channel": lookup(channel_name, detail.get("main_channel"), "contact_channel"),
            "voice_type_level1": voice or unknown,
            "topic_level2": lookup(topic_name, master.get("topic"), "topic_level2"),
            "issue_level3": lookup(issue_name, master.get("issue"), "issue_level3"),
            "subissue_level4": lookup(sub_issue_name, master.get("sub_issue"), "subissue_level4"),
            "sla_status": sla_status(created, closed, today, mapping["sla"]),
            "region_name": area["region"] if area else unknown,
        })

    # สาขาคนละเขตที่ชื่อซ้ำกัน (เช่น กฟอ.เฉลิมพระเกียรติ ใน ต.2 และ ฉ.3) ต่อท้ายด้วยเขต เพื่อให้หนึ่งชื่ออยู่ได้พื้นที่เดียว
    office_areas: Dict[str, set] = {}
    for record in records:
        office_areas.setdefault(record["pea_office"], set()).add(record["region"])
    for record in records:
        if len(office_areas[record["pea_office"]]) > 1:
            record["pea_office"] = f"{record['pea_office']} ({record['region']})"
            adjusted["ชื่อการไฟฟ้าซ้ำหลายเขต (ต่อท้ายด้วยเขต)"] += 1

    report = {
        "source_rows": len(tables.get("voc_master", [])),
        "output_rows": len(records),
        "skipped": dict(skipped),
        "adjusted": dict(adjusted),
        # จำนวนแถวที่จับคู่ไม่ได้ต่อคอลัมน์ พร้อมตัวอย่างค่าที่พบบ่อย 5 อันดับ
        "unmapped": {field: {"rows": sum(counter.values()), "top_values": [[str(value), count] for value, count in counter.most_common(5)]}
                     for field, counter in unmapped.items() if counter},
    }
    return records, report
