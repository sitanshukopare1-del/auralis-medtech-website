#!/usr/bin/env python3
"""
Auralis Med Tech & SAFE VAC - Local Development Server
Runs Website 1 on Port 8000: http://localhost:8000
"""

import os
import sys
import webbrowser
from http.server import HTTPServer, SimpleHTTPRequestHandler

PORT = 8000
BASE_DIR = os.path.abspath(os.path.dirname(__file__))

class WebAppHandler(SimpleHTTPRequestHandler):
    """Serves Website 1 from the project root directory"""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def do_GET(self):
        if self.path in ('/', ''):
            self.path = '/index.html'
        return super().do_GET()

    def log_message(self, format, *args):
        print(f"[Auralis Server] {args[0]} - {args[1]}")


def main():
    server_address = ('', PORT)
    httpd = HTTPServer(server_address, WebAppHandler)
    
    print("=" * 64)
    print("  AURALIS MED TECH - SAFE VAC WEB APPLICATION")
    print(f"  Local URL:   http://localhost:{PORT}")
    print(f"  Directory:   {BASE_DIR}")
    print("=" * 64)
    print("  Press Ctrl+C to stop the server.\n")

    if "--no-browser" not in sys.argv:
        try:
            webbrowser.open(f"http://localhost:{PORT}")
        except Exception:
            pass

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[Server Stopped] Auralis Med Tech server shut down cleanly.")
        httpd.server_close()
        sys.exit(0)


if __name__ == '__main__':
    main()
