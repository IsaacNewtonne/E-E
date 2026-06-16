@echo off
setlocal

cd /d "%~dp0"

set "VENV_DIR=.venv"
set "PYTHON_EXE=%VENV_DIR%\Scripts\python.exe"
set "HOST=127.0.0.1"
set "PORT=8765"
set "APP_URL=http://%HOST%:%PORT%/"

echo.
echo  EvitaativE Pool League
echo  ----------------------

if not exist "%PYTHON_EXE%" (
    echo [1/3] Creating Python virtual environment...
    where py >nul 2>&1
    if not errorlevel 1 (
        py -3 -m venv --without-pip "%VENV_DIR%"
    ) else (
        where python >nul 2>&1
        if errorlevel 1 (
            echo.
            echo ERROR: Python 3 was not found.
            echo Install Python from https://www.python.org/downloads/ and run this file again.
            pause
            exit /b 1
        )
        python -m venv --without-pip "%VENV_DIR%"
    )

    if errorlevel 1 (
        echo.
        echo ERROR: The virtual environment could not be created.
        pause
        exit /b 1
    )

    if not exist "%PYTHON_EXE%" (
        echo.
        echo ERROR: The virtual environment could not be created.
        pause
        exit /b 1
    )
) else (
    echo [1/3] Virtual environment ready.
)

"%PYTHON_EXE%" --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: The existing virtual environment is incomplete.
    echo Delete the .venv folder and run this file again.
    pause
    exit /b 1
)

echo [2/3] Checking app server...
powershell -NoProfile -Command "try { $response = Invoke-WebRequest -Uri '%APP_URL%' -UseBasicParsing -TimeoutSec 1; if ($response.StatusCode -eq 200) { exit 0 } } catch {}; exit 1"

if errorlevel 1 (
    echo       Starting local server at %APP_URL%
    start "EvitaativE Server" /min "%PYTHON_EXE%" -m http.server %PORT% --bind %HOST% --directory "%~dp0"

    powershell -NoProfile -Command "$ready = $false; 1..30 | ForEach-Object { if (-not $ready) { try { $response = Invoke-WebRequest -Uri '%APP_URL%' -UseBasicParsing -TimeoutSec 1; if ($response.StatusCode -eq 200) { $ready = $true } } catch {}; if (-not $ready) { Start-Sleep -Milliseconds 200 } } }; if (-not $ready) { exit 1 }"
    if errorlevel 1 (
        echo.
        echo ERROR: The local app server did not start.
        pause
        exit /b 1
    )
) else (
    echo       App server is already running.
)

echo [3/3] Opening EvitaativE...
start "" "%APP_URL%"

echo.
echo App opened at %APP_URL%
echo You can close this window. The server runs in a minimized window.

endlocal
