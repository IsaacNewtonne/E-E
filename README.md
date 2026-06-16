# EvitaativE Pool League

A dependency-free, local-first pool league manager for a single organizer.

## Shared Game Night Page

Use the GitHub Pages version for pool night:

```text
https://isaacnewtonne.github.io/E-E/GameNightOps/
```

## Features

- Player roster and profile images
- Configurable singles-win, doubles-win, and loss points
- Fast nightly score sheets with any number of singles and doubles game rows
- Keyboard-first entry with Win/Loss, Singles/Doubles, Enter, and duplicate shortcuts
- One-click paired doubles-game rows with validation and visual grouping
- Automatic singles, doubles, win, loss, and points standings
- Player profiles with streaks and complete game history
- Editable and inactive player management
- Infographic dashboard with team KPIs, points bars, win-rate chart, and pairing stats
- CSV exports for game rows and standings
- Season archival with historical standings
- JSON backup export and restore
- Responsive desktop and mobile interface

## Run

Double-click `run.bat`. It creates a lightweight Python virtual environment, starts
the local server, and opens `http://127.0.0.1:8765`.

## Native Windows App

Double-click `run_desktop.bat` to run the app in a native desktop window. This
uses `uv` with Python 3.13 and installs optional desktop dependencies into
`.desktop-env`.

Run `build_windows.bat` to create:

```text
dist\EvitaativE-Pool-League\EvitaativE-Pool-League.exe
```

The executable build requires internet access the first time to install PyWebView
and PyInstaller.

## Test

```powershell
npm run check
```

The test suite uses Node's built-in test runner and requires no npm installation.

## Data

Data is stored in browser `localStorage`. Export a JSON backup from Settings before
clearing browser data or moving to another computer.

## Project Structure

- `league-core.js`: tested league rules, calculations, analytics, imports, migrations
- `app.js`: browser state, rendering, and interactions
- `styles.css`: responsive visual system
- `desktop.py`: optional native desktop wrapper
- `tests/`: automated league-rule tests

## License

MIT
