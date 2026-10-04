@echo off
rem Publish the dashboard at http://<this-machine>/test/voc-dashboard/
rem   1. builds dist/ (npm run build:publish)
rem   2. starts the database buffer (publish-buffer.bat) if port 8765 is free
rem   3. starts Caddy on port 80 (Caddyfile of pea-voc-database-query) if port 80 is free
rem Close the "VOC Buffer" / "Caddy :80" windows to stop.
cd /d "%~dp0"
set "CADDY_DIR=%~dp0..\pea-voc-database-query"

call npm run build:publish || (echo Build failed & pause & exit /b 1)

netstat -ano | findstr /r /c:"127.0.0.1:8765 .*LISTENING" >nul
if errorlevel 1 (start "VOC Buffer" /min cmd /c "%~dp0publish-buffer.bat") else (echo Buffer already running on 8765)

netstat -ano | findstr /r /c:"0.0.0.0:80 .*LISTENING" >nul
if errorlevel 1 (start "Caddy :80" /min /d "%CADDY_DIR%" "%CADDY_DIR%\tools\caddy.exe" run --config Caddyfile --adapter caddyfile) else (echo Caddy already running on 80)

echo.
echo Open: http://172.16.100.191/test/voc-dashboard/
pause
