@echo off
REM Cutline installer for Windows.
setlocal EnableDelayedExpansion
cd /d "%~dp0"

set PY=
where py >nul 2>nul
if %ERRORLEVEL%==0 (
  for /f "delims=" %%i in ('py -3 -c "import sys; print(sys.executable)"') do set PY=%%i
)
if "%PY%"=="" (
  where python >nul 2>nul
  if %ERRORLEVEL%==0 set PY=python
)
if "%PY%"=="" (
  echo Cutline needs Python 3.10 or newer. Install it from python.org
  echo and tick "Add Python to PATH" during setup.
  pause
  exit /b 1
)

echo Creating the local environment...
if not exist ".venv" "%PY%" -m venv .venv
call ".venv\Scripts\activate.bat"

echo Installing the engine...
python -m pip install --quiet --upgrade pip wheel
python -m pip install --quiet -r requirements.txt

echo Installing local speech-to-text...
python -m pip install --quiet "faster-whisper>=1.0"
if errorlevel 1 echo faster-whisper could not be installed. Captions will accept SRT/VTT files.

echo Checking the install...
python -m cutline doctor

echo.
echo Done. Double-click Cutline.bat to start the studio.
pause
endlocal
