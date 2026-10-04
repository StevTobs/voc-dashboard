@echo off
rem Database buffer for the dashboard at http://<this-machine>/test/voc-dashboard/
rem   Connects to the real PostgreSQL over SSH (settings: .env in PEA_VOC_DB_DIR, passwords: .env in this repo)
rem   Listens on 127.0.0.1:8765; Caddy forwards /test/voc-dashboard/api/* here.
rem   If the connection drops the buffer exits and this script restarts it after 30 seconds.
chcp 65001 >nul
set PYTHONIOENCODING=utf-8
cd /d "%~dp0"
set "PY=..\pea-voc-database-query\.venv\Scripts\python.exe"
if not exist "%PY%" (
  echo Not found: %PY%  - set up the venv of pea-voc-database-query first.
  pause
  exit /b 1
)
:loop
"%PY%" -m buffer --source external
echo Buffer stopped - restarting in 30 seconds. Press Ctrl+C to quit.
timeout /t 30 /nobreak >nul
goto loop
