"""Native desktop launcher for EvitaativE Pool League."""

from __future__ import annotations

import http.server
import sys
import threading
from pathlib import Path

import webview


ROOT = Path(getattr(sys, "_MEIPASS", Path(__file__).resolve().parent))
PORT = 8766


def main() -> None:
    handler = lambda *args, **kwargs: http.server.SimpleHTTPRequestHandler(
        *args, directory=str(ROOT), **kwargs
    )
    server = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    webview.create_window(
        "EvitaativE Pool League",
        f"http://127.0.0.1:{PORT}",
        width=1440,
        height=900,
        min_size=(900, 620),
    )
    webview.start()
    server.shutdown()


if __name__ == "__main__":
    main()
