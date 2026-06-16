@echo off
setlocal
cd /d "%~dp0"

if not exist ".desktop-env\Scripts\python.exe" (
    uv venv --python 3.13 ".desktop-env"
)

uv pip install --python ".desktop-env\Scripts\python.exe" -r requirements-desktop.txt
if errorlevel 1 (
    echo Failed to install desktop dependencies.
    pause
    exit /b 1
)

".desktop-env\Scripts\python.exe" desktop.py
endlocal
