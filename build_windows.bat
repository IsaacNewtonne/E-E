@echo off
setlocal
cd /d "%~dp0"

if not exist ".desktop-env\Scripts\python.exe" (
    uv venv --python 3.13 ".desktop-env"
)

uv pip install --python ".desktop-env\Scripts\python.exe" -r requirements-desktop.txt
if errorlevel 1 exit /b 1

".desktop-env\Scripts\pyinstaller.exe" --noconfirm --clean --windowed --name EvitaativE-Pool-League --add-data "index.html;." --add-data "styles.css;." --add-data "app.js;." --add-data "league-core.js;." --add-data "Assets;Assets" desktop.py
if errorlevel 1 exit /b 1

echo.
echo Built dist\EvitaativE-Pool-League\EvitaativE-Pool-League.exe
endlocal
