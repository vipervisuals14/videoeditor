@echo off
REM Cutline launcher for Windows.
setlocal
cd /d "%~dp0"

if not exist ".venv\Scripts\python.exe" (
  echo Cutline has not been installed yet.
  echo Run install-windows.bat first, then double-click this file.
  pause
  exit /b 1
)

".venv\Scripts\python.exe" -m cutline serve
if errorlevel 1 pause
endlocal
