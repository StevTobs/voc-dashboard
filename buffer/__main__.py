"""เริ่ม buffer

  python3 -m buffer                       ใช้ dev.db (ภายใน) เป็นแหล่งข้อมูล
  python3 -m buffer --check-external      ใช้ dev.db และตรวจสถานะฐานข้อมูลจริงด้วย
  python3 -m buffer --source external     ใช้ฐานข้อมูลจริง (ภายนอก) เป็นแหล่งข้อมูล
  python3 -m buffer --once out.csv        ดึงครั้งเดียว เขียน CSV แล้วแสดงรายงาน mapping

การต่อฐานข้อมูลจริงใช้โค้ดและ .env ของโปรเจกต์ pea_voc_db (PEA_VOC_DB_DIR) และต้องรันด้วย Python ที่มี psycopg/paramiko
เช่น ~/Desktop/pea_voc_db/.venv/bin/python -m buffer --source external
"""
from __future__ import annotations

import argparse
import errno
import getpass
import json
import os
import sys
from dataclasses import replace
from datetime import datetime, timezone
from pathlib import Path

from .core import Buffer, to_csv
from .server import serve
from .sources import PostgresSource, SqliteSource
from .transform import build_records

PACKAGE_DIR = Path(__file__).resolve().parent
REPO_DIR = PACKAGE_DIR.parent
DEFAULT_DB_TOOLS = Path.home() / "Desktop" / "pea_voc_db"


def connect_external() -> PostgresSource:
    """ต่อ PostgreSQL แบบ read-only ด้วยโค้ดเดิมของ pea_voc_db: ตรวจเครือข่าย → SSH tunnel (ถ้าตั้งไว้) → connect"""
    tools = Path(os.getenv("PEA_VOC_DB_DIR", DEFAULT_DB_TOOLS)).expanduser()
    if not (tools / "sample_export.py").exists():
        sys.exit(f"ไม่พบโปรเจกต์ pea_voc_db ที่ {tools} — ตั้งค่า PEA_VOC_DB_DIR ให้ชี้ไปที่โฟลเดอร์นั้น")
    sys.path.insert(0, str(tools))
    try:
        import netguard
        import sample_export as se
        from ssh_tunnel import SSHTunnel
    except ImportError as exc:
        sys.exit(f"ไม่พบไลบรารี {exc.name} — รันด้วย Python ของ {tools / '.venv'}")

    se.load_env()
    network = netguard.check_network_from_env()
    if not network.allowed:
        sys.exit(f"ไม่เชื่อมต่อฐานข้อมูลภายนอก: {network.reason}")
    ssh_host = os.getenv("SSH_HOST", "").strip()
    cfg = se.load_config(require_host=not ssh_host)
    tunnel = None
    if ssh_host:
        tunnel = SSHTunnel(ssh_host, se._int_env("SSH_PORT", 22, 1, 65535), os.getenv("SSH_USER", "").strip(),
                           os.getenv("SSH_REMOTE_DB_HOST", "").strip(), se._int_env("SSH_REMOTE_DB_PORT", 5432, 1, 65535),
                           timeout=cfg.connect_timeout)
        # รหัสผ่านใช้ตอนเชื่อมต่อเท่านั้น ไม่เก็บและไม่ log
        local_port = tunnel.start(getpass.getpass(f"รหัสผ่าน SSH ของ {tunnel.ssh_user}@{ssh_host} (เว้นว่างเพื่อใช้ key): ") or None)
        cfg = replace(cfg, host="127.0.0.1", port=local_port)
    try:
        conn = se.connect(cfg, getpass.getpass(f"รหัสผ่านฐานข้อมูลของ {cfg.user}: "))
    except Exception:
        if tunnel:
            tunnel.stop()
        raise
    return PostgresSource(conn, f"PostgreSQL {cfg.dbname}", netguard.check_network_from_env, tunnel)


def main() -> int:
    parser = argparse.ArgumentParser(prog="python3 -m buffer", description="PEA VOC data buffer")
    parser.add_argument("--source", choices=["internal", "external"], default="internal", help="แหล่งข้อมูลที่ส่งให้ dashboard")
    parser.add_argument("--check-external", action="store_true", help="ตรวจสถานะฐานข้อมูลจริงด้วย แม้ใช้ dev.db เป็นแหล่งข้อมูล")
    parser.add_argument("--db", type=Path, default=Path(os.getenv("BUFFER_DEV_DB", REPO_DIR / "dev.db")), help="path ของ dev.db")
    parser.add_argument("--mapping", type=Path, default=PACKAGE_DIR / "mapping.json")
    parser.add_argument("--cache-dir", type=Path, default=PACKAGE_DIR / "cache")
    parser.add_argument("--port", type=int, default=int(os.getenv("BUFFER_PORT", 8765)))
    parser.add_argument("--refresh", type=int, default=int(os.getenv("BUFFER_REFRESH_SECONDS", 300)), help="วินาทีระหว่างการดึงข้อมูลใหม่")
    parser.add_argument("--health", type=int, default=int(os.getenv("BUFFER_HEALTH_SECONDS", 60)), help="วินาทีระหว่างการตรวจสถานะฐานข้อมูล")
    parser.add_argument("--once", type=Path, metavar="CSV", help="ดึงครั้งเดียว เขียน CSV แล้วออก")
    args = parser.parse_args()

    mapping = json.loads(args.mapping.read_text("utf-8"))
    internal = SqliteSource(args.db)
    external = connect_external() if args.source == "external" or args.check_external else None
    source = external if args.source == "external" else internal

    if args.once:
        records, report = build_records(source.fetch_tables(), mapping, datetime.now(timezone.utc))
        args.once.write_bytes(to_csv(records))
        print(json.dumps(report, ensure_ascii=False, indent=2))
        if external:
            external.close()
        return 0

    buffer = Buffer(source, mapping, args.cache_dir, internal=internal, external=external,
                    refresh_seconds=args.refresh, health_seconds=args.health)
    try:
        server = serve(buffer, args.port)
    except OSError as exc:
        buffer.stop()
        if exc.errno == errno.EADDRINUSE:
            sys.exit(f"port {args.port} ถูกใช้อยู่ — อาจมี buffer อีกตัวรันอยู่แล้ว (ดูด้วย: lsof -i :{args.port}) หรือใช้ --port อื่น")
        raise
    buffer.start()
    print(f"buffer พร้อมที่ http://127.0.0.1:{args.port}/api/status  (แหล่งข้อมูล: {source.label}, refresh ทุก {args.refresh} วินาที)")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
        buffer.stop()
    return 0


if __name__ == "__main__":
    sys.exit(main())
