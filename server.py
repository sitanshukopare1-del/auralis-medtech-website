#!/usr/bin/env python3
"""
Auralis Med Tech & SAFE VAC - Multi-Port Local Server Launcher
Runs both websites simultaneously from the EXACT SAME main folder:
  - Port 8000: Public Website & SAFE VAC Platform (index.html)
  - Port 8080: Secure Healthcare Clinician & Fleet Portal (portal.html)
"""

import os
import sys
import threading
import webbrowser
from http.server import HTTPServer, SimpleHTTPRequestHandler

PORT_PUBLIC = 8000
PORT_PORTAL = 8080

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

class PublicSiteHandler(SimpleHTTPRequestHandler):
    """Handler for Port 8000: Serves index.html at root"""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def do_GET(self):
        if self.path in ('/', ''):
            self.path = '/index.html'
        return super().do_GET()

    def log_message(self, format, *args):
        # Concise logging
        print(f"[Port {PORT_PUBLIC} Public Site] {args[0]} - {args[1]}")


class SecurePortalHandler(SimpleHTTPRequestHandler):
    """Handler for Port 8080: Serves portal.html at root"""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def do_GET(self):
        if self.path in ('/', ''):
            self.path = '/portal.html'
        return super().do_GET()

    def log_message(self, format, *args):
        # Concise logging
        print(f"[Port {PORT_PORTAL} Clinician Portal] {args[0]} - {args[1]}")


def run_server(server_class, port, name):
    server_address = ('', port)
    httpd = server_class(server_address, PublicSiteHandler if port == PORT_PUBLIC else SecurePortalHandler)
    print(f"  [OK] {name} running on: http://localhost:{port}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        httpd.server_close()


def main():
    print("=" * 68)
    print("  AURALIS MED TECH & SAFE VAC - DUAL-PORT LOCAL SERVER")
    print("  All files running from the SAME main folder:")
    print(f"  Directory: {BASE_DIR}")
    print("=" * 68)

    # Start Server 1 (Public Website on Port 8000)
    t1 = threading.Thread(target=run_server, args=(HTTPServer, PORT_PUBLIC, "Website 1 (Public Website)"), daemon=True)
    t1.start()

    # Start Server 2 (Secure Clinician Portal on Port 8080)
    t2 = threading.Thread(target=run_server, args=(HTTPServer, PORT_PORTAL, "Website 2 (Clinician Portal)"), daemon=True)
    t2.start()

    print("\n" + "-" * 68)
    print("  ACCESS YOUR WEBSITES:")
    print(f"  * Public Website:     http://localhost:{PORT_PUBLIC}")
    print(f"  * Clinician Portal:   http://localhost:{PORT_PORTAL}")
    print(f"  * Investor Pitch Deck: http://localhost:{PORT_PUBLIC}/pitch_deck.html")
    print("-" * 68)
    print("  Press Ctrl+C in this terminal to stop both servers.\n")

    # Optionally open browser if flag provided or by default
    if "--no-browser" not in sys.argv:
        try:
            webbrowser.open(f"http://localhost:{PORT_PUBLIC}")
            webbrowser.open(f"http://localhost:{PORT_PORTAL}")
        except Exception:
            pass

    try:
        while True:
            t1.join(1)
            t2.join(1)
    except KeyboardInterrupt:
        print("\n[Shutting down] Stopped both local servers cleanly.")
        sys.exit(0)

if __name__ == '__main__':
    main()
