"""HTTP API ของ buffer — เปิดเฉพาะ 127.0.0.1 (เครื่องอื่นในเครือข่ายเข้าไม่ได้)

GET  /api/complaints.csv  snapshot ล่าสุด คอลัมน์เดียวกับ public/data/complaints.csv
GET  /api/status          สถานะ snapshot, refresh ล่าสุด และสถานะฐานข้อมูลภายใน/ภายนอก
POST /api/refresh         สั่งดึงข้อมูลใหม่ (ต้องมี header X-Buffer-Refresh: 1) — dashboard เรียกทุกครั้งที่เปิด/รีเฟรชหน้า
                          ถ้า snapshot ใหม่กว่า MIN_REFRESH_SECONDS จะไม่ดึงซ้ำ เพื่อไม่ให้ผู้ใช้หลายคนพร้อมกันกดฐานข้อมูล
"""
from __future__ import annotations

import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from .core import Buffer

MIN_REFRESH_SECONDS = 30


def make_handler(buffer: Buffer):
    class Handler(BaseHTTPRequestHandler):
        server_version = "pea-voc-buffer"

        def _send(self, code: int, body: bytes, content_type: str, extra=None) -> None:
            self.send_response(code)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            for key, value in (extra or {}).items():
                self.send_header(key, value)
            self.end_headers()
            self.wfile.write(body)

        def _json(self, code: int, payload) -> None:
            self._send(code, json.dumps(payload, ensure_ascii=False).encode("utf-8"), "application/json; charset=utf-8")

        def do_GET(self) -> None:
            path = self.path.split("?", 1)[0]
            if path == "/api/complaints.csv":
                snap = buffer.snapshot
                if snap is None:
                    return self._json(503, {"error": "ยังไม่มี snapshot — buffer กำลังดึงข้อมูลครั้งแรก หรือดึงไม่สำเร็จ", "status": buffer.status()})
                return self._send(200, snap.csv, "text/csv; charset=utf-8", {"X-Snapshot-Id": snap.id})
            if path == "/api/status":
                return self._json(200, buffer.status())
            self._json(404, {"error": "not found"})

        def do_POST(self) -> None:
            if self.path.split("?", 1)[0] != "/api/refresh":
                return self._json(404, {"error": "not found"})
            # header พิเศษบังคับให้เบราว์เซอร์ทำ preflight หน้าเว็บอื่นจึงสั่ง refresh แทนผู้ใช้ไม่ได้
            if self.headers.get("X-Buffer-Refresh") != "1":
                return self._json(403, {"error": "missing X-Buffer-Refresh header"})
            age = (buffer.status()["snapshot"] or {}).get("age_seconds")
            if age is None or age >= MIN_REFRESH_SECONDS:
                buffer.refresh()
                buffer.check_health()
            self._json(200, buffer.status())

        def log_message(self, format, *args) -> None:  # noqa: A002 — ไม่ log ทุก request
            pass

    return Handler


def serve(buffer: Buffer, port: int) -> ThreadingHTTPServer:
    return ThreadingHTTPServer(("127.0.0.1", port), make_handler(buffer))
