# EvitaativE Pool League 🎱

Dark-mode pool night command center for tracking players, racks, standings, reports,
and game-night score sheets.

Built to feel fast, local, and practical: no database, no accounts, no cloud lock-in.
Just open it, enter the night, and keep the table moving.

## 🔥 Play Tonight

Use the shareable GitHub Pages game-night tracker:

```text
https://isaacnewtonne.github.io/E-E/GameNightOps/
```

Best for phones on pool night. Add players, record racks, and keep the score visible
without installing anything.

## ✨ What It Does

- 🎱 Fast game-night score sheets for singles and doubles
- 🧮 Automatic points, wins, losses, standings, and win rates
- 👥 Player roster with active/inactive player support
- 🤝 Doubles pairing validation and chemistry stats
- 📊 Dashboard KPIs, bars, win-rate charts, and performance signals
- 📄 Printable performance reports for game night or season to date
- 📤 CSV exports for games and standings
- 💾 JSON backup and restore
- 🗂️ Season archive for historical standings
- 📱 Responsive layout for desktop and mobile

## 🕹️ Ways To Run

### Browser App

Double-click:

```text
run.bat
```

That starts a lightweight local server and opens:

```text
http://127.0.0.1:8765
```

### Native Windows App

Double-click:

```text
run_desktop.bat
```

This opens the app in a native desktop window using PyWebView.

### Build The Windows App

Run:

```text
build_windows.bat
```

Output:

```text
dist\EvitaativE-Pool-League\EvitaativE-Pool-League.exe
```

First build may need internet access to install PyWebView and PyInstaller.

## 🧪 Test

```powershell
npm run check
```

Uses Node's built-in test runner. No npm install required for the test suite.

## 💾 Data Notes

Data is stored locally in the browser with `localStorage`.

Before clearing browser data, switching devices, or resetting a season, export a JSON
backup from Settings.

## 🧱 Project Map

- `index.html`: main league manager UI
- `GameNightOps/index.html`: shareable GitHub Pages tracker
- `league-core.js`: league rules, calculations, analytics, imports, migrations
- `app.js`: browser state, rendering, and interactions
- `styles.css`: dark visual system
- `desktop.py`: optional native desktop wrapper
- `tests/`: automated league-rule tests

## 🏁 Repo Status

Clean public repo setup:

- ✅ No embedded real season history
- ✅ No build output or virtual environments
- ✅ No private screenshots
- ✅ GitHub Pages workflow included

## 📜 License

MIT
