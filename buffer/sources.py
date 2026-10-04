"""แหล่งข้อมูลของ buffer: ภายใน (dev.db SQLite) และภายนอก (PostgreSQL pea_voc ผ่าน SSH)

ทั้งสองแบบคืนข้อมูลรูปแบบเดียวกัน {ชื่อตาราง: [แถวแบบ dict]} และใช้ SELECT เท่านั้น
ชื่อตาราง/คอลัมน์เป็นค่าคงที่ในโค้ด ไม่รับจากผู้ใช้
"""
from __future__ import annotations

import sqlite3
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional

# เลือกเฉพาะคอลัมน์ที่ transform ใช้ (ไม่ดึงข้อมูลส่วนบุคคล)
COLUMNS: Dict[str, List[str]] = {
    "voc_master": ["id", "voc_no", "status", "created_at", "updated_at", "is_deleted", "request_type", "topic", "issue", "sub_issue"],
    "voc_detail": ["voc_master_id", "request_pea", "main_channel", "completed_date"],
    "voc_status": ["id", "status_en", "group_status_th"],
    "voc_channels": ["id", "name"],
    "voc_issues": ["id", "name"],
    "voc_types": ["id", "name"],
    "pea_office": ["name", "region_group"],
}
# ตารางที่มี updated_at ใช้ดูความสดของข้อมูล
FRESHNESS_TABLES = ["voc_master", "voc_detail", "voc_tracking"]


class SourceError(Exception):
    pass


def _iso(value: Any) -> Optional[str]:
    return value.isoformat() if isinstance(value, datetime) else (str(value) if value else None)


class SqliteSource:
    """ฐานข้อมูลภายใน: เปิดไฟล์แบบอ่านอย่างเดียว (mode=ro) ทุกครั้งที่ใช้"""
    kind = "internal"

    def __init__(self, path: Path) -> None:
        self.path = Path(path)
        self.label = f"dev.db ({self.path.name})"

    def _connect(self) -> sqlite3.Connection:
        if not self.path.exists():
            raise SourceError(f"ไม่พบไฟล์ {self.path}")
        conn = sqlite3.connect(f"file:{self.path}?mode=ro", uri=True, timeout=5)
        conn.row_factory = sqlite3.Row
        return conn

    def fetch_tables(self) -> Dict[str, List[Dict[str, Any]]]:
        with self._connect() as conn:
            return {table: [dict(row) for row in conn.execute(f'SELECT {", ".join(columns)} FROM "{table}"')]
                    for table, columns in COLUMNS.items()}

    def health(self) -> Dict[str, Any]:
        started = time.monotonic()
        stat = self.path.stat()
        with self._connect() as conn:
            tables = {}
            for table in FRESHNESS_TABLES:
                count, latest = conn.execute(f'SELECT COUNT(*), MAX(updated_at) FROM "{table}"').fetchone()
                tables[table] = {"rows": count, "latest_update": latest}
        return {
            "file": str(self.path),
            "file_modified": datetime.fromtimestamp(stat.st_mtime).astimezone().isoformat(timespec="seconds"),
            "size_bytes": stat.st_size,
            "tables": tables,
            "latency_ms": round((time.monotonic() - started) * 1000),
        }


class PostgresSource:
    """ฐานข้อมูลภายนอก: ใช้ connection read-only ที่เปิดไว้แล้ว ตรวจเครือข่ายที่อนุญาตก่อนทุกคำสั่ง

    รหัสผ่านไม่ถูกเก็บในนี้ ถ้า connection หลุดต้องเริ่ม buffer ใหม่และกรอกรหัสผ่านอีกครั้ง
    """
    kind = "external"

    def __init__(self, conn: Any, label: str, network_check: Callable[[], Any], tunnel: Any = None) -> None:
        self.conn = conn
        self.label = label
        self.network_check = network_check
        self.tunnel = tunnel

    def _guard(self) -> None:
        network = self.network_check()
        if not network.allowed:
            self.close()
            raise SourceError(f"ตัดการเชื่อมต่อแล้ว: {network.reason}")
        if self.conn is None or self.conn.closed:
            raise SourceError("connection ปิดแล้ว — เริ่ม buffer ใหม่เพื่อกรอกรหัสผ่าน")
        if self.tunnel is not None and not self.tunnel.is_active:
            raise SourceError(f"SSH tunnel หลุด{': ' + self.tunnel.last_error if self.tunnel.last_error else ''}")

    def _query(self, statement: Any) -> List[Dict[str, Any]]:
        from psycopg.rows import dict_row
        try:
            with self.conn.cursor(row_factory=dict_row) as cursor:
                cursor.execute(statement)
                rows = cursor.fetchall()
            self.conn.rollback()  # จบ transaction read-only ทุกครั้ง ไม่ค้าง snapshot เก่า
            return rows
        except Exception:
            self.conn.rollback()
            raise

    def fetch_tables(self) -> Dict[str, List[Dict[str, Any]]]:
        from psycopg import sql
        self._guard()
        result = {}
        for table, columns in COLUMNS.items():
            statement = sql.SQL("SELECT {} FROM {}").format(
                sql.SQL(", ").join(map(sql.Identifier, columns)), sql.Identifier("public", table))
            result[table] = self._query(statement)
        return result

    def health(self) -> Dict[str, Any]:
        from psycopg import sql
        self._guard()
        started = time.monotonic()
        self._query(sql.SQL("SELECT 1 AS ok"))
        latency = round((time.monotonic() - started) * 1000)
        tables = {}
        for table in FRESHNESS_TABLES:
            # จำนวนแถวใช้ค่าประมาณจากสถิติของ PostgreSQL เพื่อไม่ต้อง scan ตารางใหญ่
            row = self._query(sql.SQL(
                "SELECT (SELECT reltuples::bigint FROM pg_class WHERE oid = {regclass}::regclass) AS rows, MAX(updated_at) AS latest FROM {table}"
            ).format(regclass=sql.Literal(f"public.{table}"), table=sql.Identifier("public", table)))[0]
            tables[table] = {"rows": row["rows"], "rows_estimated": True, "latest_update": _iso(row["latest"])}
        return {"database": self.label, "tables": tables, "latency_ms": latency}

    def close(self) -> None:
        if self.conn is not None and not self.conn.closed:
            self.conn.close()
        if self.tunnel is not None:
            self.tunnel.stop()
