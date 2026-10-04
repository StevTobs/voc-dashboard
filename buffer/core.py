"""ตัวกลาง (buffer): ดึงข้อมูลจากแหล่งหลัก แปลงคอลัมน์ เก็บ snapshot ล่าสุด และตรวจสถานะฐานข้อมูลภายใน/ภายนอก

- dashboard อ่านจาก snapshot เสมอ ไม่ยิงฐานข้อมูลตรง
- refresh ล้มเหลว → ใช้ snapshot เดิมต่อและแจ้งว่าข้อมูลค้าง (stale)
- snapshot ถูกเขียนลงไฟล์แบบ atomic จึงใช้ต่อได้หลังเริ่มโปรแกรมใหม่
"""
from __future__ import annotations

import csv
import hashlib
import io
import json
import os
import threading
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional

from .transform import OUTPUT_FIELDS, build_records


def now_iso() -> str:
    return datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")


def to_csv(records) -> bytes:
    out = io.StringIO()
    writer = csv.DictWriter(out, fieldnames=OUTPUT_FIELDS, lineterminator="\n")
    writer.writeheader()
    writer.writerows(records)
    return out.getvalue().encode("utf-8")


def _write_atomic(path: Path, data: bytes) -> None:
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_bytes(data)
    os.replace(tmp, path)


@dataclass
class Snapshot:
    id: str
    csv: bytes
    source: str
    created_at: str
    rows: int
    report: Dict[str, Any] = field(default_factory=dict)


class Buffer:
    def __init__(self, source, mapping: Dict[str, Any], cache_dir: Path, internal=None, external=None,
                 refresh_seconds: int = 300, health_seconds: int = 60) -> None:
        self.source = source
        self.mapping = mapping
        self.cache_dir = Path(cache_dir)
        self.internal, self.external = internal, external
        self.refresh_seconds, self.health_seconds = refresh_seconds, health_seconds
        self.snapshot: Optional[Snapshot] = None
        self.last_refresh: Dict[str, Any] = {"ok": None, "at": None, "error": None, "duration_ms": None}
        self.health: Dict[str, Any] = {}
        self._lock = threading.Lock()
        self._refreshing = threading.Lock()
        self._stop = threading.Event()
        self._load_cache()

    # --- snapshot -----------------------------------------------------------
    def _load_cache(self) -> None:
        csv_path, meta_path = self.cache_dir / "complaints.csv", self.cache_dir / "snapshot.json"
        if csv_path.exists() and meta_path.exists():
            meta = json.loads(meta_path.read_text("utf-8"))
            self.snapshot = Snapshot(csv=csv_path.read_bytes(), **meta)

    def refresh(self) -> bool:
        """ดึงใหม่ทั้งชุด ถ้ามีการ refresh ค้างอยู่จะไม่ซ้อน"""
        if not self._refreshing.acquire(blocking=False):
            return False
        started = time.monotonic()
        try:
            tables = self.source.fetch_tables()
            records, report = build_records(tables, self.mapping, datetime.now(timezone.utc))
            data = to_csv(records)
            snapshot = Snapshot(id=hashlib.sha256(data).hexdigest()[:12], csv=data, source=self.source.label,
                                created_at=now_iso(), rows=len(records), report=report)
            self.cache_dir.mkdir(parents=True, exist_ok=True)
            _write_atomic(self.cache_dir / "complaints.csv", data)
            meta = {key: value for key, value in snapshot.__dict__.items() if key != "csv"}
            _write_atomic(self.cache_dir / "snapshot.json", json.dumps(meta, ensure_ascii=False, indent=2).encode("utf-8"))
            with self._lock:
                self.snapshot = snapshot
                self.last_refresh = {"ok": True, "at": now_iso(), "error": None, "duration_ms": round((time.monotonic() - started) * 1000)}
            return True
        except Exception as exc:  # เก็บ snapshot เดิมไว้ใช้ต่อ
            with self._lock:
                self.last_refresh = {"ok": False, "at": now_iso(), "error": f"{type(exc).__name__}: {exc}", "duration_ms": round((time.monotonic() - started) * 1000)}
            return False
        finally:
            self._refreshing.release()

    # --- สถานะฐานข้อมูล ------------------------------------------------------
    @staticmethod
    def _check(source) -> Dict[str, Any]:
        if source is None:
            return {"state": "not_configured", "checked_at": now_iso()}
        try:
            return {"state": "online", "label": source.label, "checked_at": now_iso(), **source.health()}
        except Exception as exc:
            return {"state": "offline", "label": source.label, "checked_at": now_iso(), "error": f"{type(exc).__name__}: {exc}"}

    def check_health(self) -> Dict[str, Any]:
        internal, external = self._check(self.internal), self._check(self.external)
        health = {"internal": internal, "external": external, "comparison": compare(internal, external)}
        with self._lock:
            self.health = health
        return health

    def status(self) -> Dict[str, Any]:
        with self._lock:
            snap = self.snapshot
            age = None
            if snap:
                age = round((datetime.now(timezone.utc) - datetime.fromisoformat(snap.created_at)).total_seconds())
            return {
                "source": {"kind": self.source.kind, "label": self.source.label},
                "snapshot": None if snap is None else {
                    "id": snap.id, "created_at": snap.created_at, "rows": snap.rows, "source": snap.source,
                    "age_seconds": age, "report": snap.report,
                    # ค้าง = refresh ล่าสุดล้มเหลว หรือ snapshot เก่ากว่ารอบ refresh สองรอบ
                    "stale": self.last_refresh["ok"] is False or (age is not None and age > 2 * self.refresh_seconds),
                },
                "last_refresh": dict(self.last_refresh),
                "refresh_seconds": self.refresh_seconds,
                "databases": self.health,
            }

    # --- งานเบื้องหลัง ---------------------------------------------------------
    def start(self) -> None:
        def loop(interval: int, work) -> None:
            while not self._stop.is_set():
                work()
                self._stop.wait(interval)
        threading.Thread(target=loop, args=(self.refresh_seconds, self.refresh), name="buffer-refresh", daemon=True).start()
        threading.Thread(target=loop, args=(self.health_seconds, self.check_health), name="buffer-health", daemon=True).start()

    def stop(self) -> None:
        self._stop.set()
        for source in {id(s): s for s in (self.source, self.internal, self.external) if s is not None}.values():
            close = getattr(source, "close", None)
            if close:
                close()


def compare(internal: Dict[str, Any], external: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """dev.db ตามหลังฐานข้อมูลจริงเท่าไร (เทียบ updated_at ล่าสุดของ voc_master)"""
    if internal.get("state") != "online" or external.get("state") != "online":
        return None
    latest = lambda health: (health.get("tables", {}).get("voc_master") or {}).get("latest_update")
    a, b = latest(internal), latest(external)
    if not a or not b:
        return None
    from .transform import parse_datetime
    da, db = parse_datetime(a), parse_datetime(b)
    if da is None or db is None:
        return None
    # dev.db เก็บเวลาแบบไม่มี timezone — ถือเป็นเวลาเดียวกับฐานข้อมูลจริงก่อนเทียบ
    if (da.tzinfo is None) != (db.tzinfo is None):
        da, db = da.replace(tzinfo=None), db.replace(tzinfo=None)
    lag = (db - da).total_seconds()
    return {"internal_latest": a, "external_latest": b, "internal_behind_seconds": round(lag), "in_sync": lag <= 0}
