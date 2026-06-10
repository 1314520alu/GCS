#!/usr/bin/env python3
"""Regression check for DroneCAN flight-controller quick parameter panels."""
from __future__ import annotations

import http.server
import os
import socket
import socketserver
import threading
import time
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
BASE_URL = "http://127.0.0.1:5501/index.html?dc_demo=1"


def start_static_server(port: int = 5501) -> None:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
      sock.settimeout(0.3)
      try:
          sock.connect(("127.0.0.1", port))
          return
      except OSError:
          pass

    class QuietHandler(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *_args, **_kwargs):
            return

    os.chdir(str(REPO_ROOT))
    httpd = socketserver.TCPServer(("127.0.0.1", port), QuietHandler)
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()


def main() -> int:
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("SKIP: playwright not installed (pip install playwright && playwright install chromium)")
        return 0

    start_static_server()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 1100})
        page.goto(BASE_URL, wait_until="domcontentloaded", timeout=30000)
        page.wait_for_selector(".main-tab", timeout=10000)
        page.click('[data-view="initial-setup"]')
        page.wait_for_timeout(300)
        page.click('[data-setup-panel="dronecan"]')
        page.wait_for_selector(".sc-dc-workbench", timeout=15000)

        page.evaluate(
            """
            () => {
              const params = new Map([
                ["CAN_SLCAN_CPORT", 1],
                ["CAN_SLCAN_SDELAY", 0],
                ["CAN_SLCAN_SERNUM", 0],
                ["CAN_SLCAN_TIMOUT", 3],
                ["SERIAL1_PROTOCOL", 2],
                ["SERIAL2_PROTOCOL", 2],
                ["CAN_P1_BITRATE", 1000000],
                ["CAN_P1_DRIVER", 1],
                ["CAN_P1_FDBITRATE", 2000000],
                ["CAN_P1_OPTIONS", 0],
                ["CAN_P2_BITRATE", 1000000],
                ["CAN_P2_DRIVER", 1],
                ["CAN_P2_FDBITRATE", 2000000],
                ["CAN_P2_OPTIONS", 0],
                ["CAN_D1_UC_NODE", 10],
                ["CAN_D1_PROTOCOL", 1],
                ["CAN_D2_UC_NODE", 20],
                ["CAN_D2_PROTOCOL", 1],
              ]);
              window.params = params;
              window._gcsConnState = "connected";
              window.writer = { ready: true };
              window.__requestNames = [];
              window.__sentParams = [];
              window.requestParamByName = async (name) => {
                window.__requestNames.push(String(name));
              };
              window.sendParamSet = async (name, value) => {
                window.__sentParams.push([String(name), Number(value)]);
                window.params.set(String(name), Number(value));
                return true;
              };
            }
            """
        )

        quick_buttons = page.locator("[data-dc-quick]")
        if quick_buttons.count() != 3:
            raise AssertionError(f"expected 3 quick-panel buttons, got {quick_buttons.count()}")

        def open_panel(kind: str, title: str, refresh_id: str, write_id: str) -> None:
            page.click(f'[data-dc-quick="{kind}"]')
            page.wait_for_selector(f"#{refresh_id}", timeout=5000)
            page.wait_for_selector(f"#{write_id}", timeout=5000)
            modal_title = page.locator("#sc-dc-modal-title").inner_text()
            if modal_title != title:
                raise AssertionError(f"{kind} title mismatch: {modal_title!r} != {title!r}")

        open_panel("can-protocol", "CAN协议", "sc-dc-canproto-refresh", "sc-dc-canproto-write")
        proto_rows = page.locator("[data-can-protocol-row]")
        if proto_rows.count() != 8:
            raise AssertionError(f"expected 8 CAN protocol rows, got {proto_rows.count()}")
        if not proto_rows.nth(0).evaluate("el => el.classList.contains('is-selected')"):
            raise AssertionError("first CAN protocol row should be selected on open")

        first_proto_input = page.locator('[data-can-protocol-param="CAN_P1_BITRATE"]')
        first_proto_input.fill("500000")
        first_proto_input.dispatch_event("input")
        if not first_proto_input.evaluate("el => el.classList.contains('dirty')"):
            raise AssertionError("dirty class missing on edited CAN protocol input")
        if not page.locator('[data-can-protocol-row="CAN_P1_BITRATE"]').evaluate("el => el.classList.contains('is-dirty')"):
            raise AssertionError("dirty row class missing on edited CAN protocol row")

        page.click('[data-can-protocol-row="CAN_P2_DRIVER"]')
        if not page.locator('[data-can-protocol-row="CAN_P2_DRIVER"]').evaluate("el => el.classList.contains('is-selected')"):
            raise AssertionError("clicked CAN protocol row should be selected")
        if page.locator('[data-can-protocol-row="CAN_P1_BITRATE"]').evaluate("el => el.classList.contains('is-selected')"):
            raise AssertionError("previous CAN protocol row should lose selected state")

        page.click("#sc-dc-canproto-refresh")
        page.wait_for_timeout(700)
        request_names = page.evaluate("() => window.__requestNames.slice()")
        expected_proto = [
            "CAN_P1_BITRATE",
            "CAN_P1_DRIVER",
            "CAN_P1_FDBITRATE",
            "CAN_P1_OPTIONS",
            "CAN_P2_BITRATE",
            "CAN_P2_DRIVER",
            "CAN_P2_FDBITRATE",
            "CAN_P2_OPTIONS",
        ]
        if request_names != expected_proto:
            raise AssertionError(f"CAN protocol refresh path mismatch: {request_names!r}")
        page.click("#sc-dc-result-close")

        first_proto_input = page.locator('[data-can-protocol-param="CAN_P1_BITRATE"]')
        first_proto_input.fill("250000")
        first_proto_input.dispatch_event("input")
        page.click("#sc-dc-canproto-write")
        page.wait_for_timeout(250)
        sent = page.evaluate("() => window.__sentParams.slice()")
        if sent[-1] != ["CAN_P1_BITRATE", 250000]:
            raise AssertionError(f"CAN protocol write path mismatch: {sent!r}")
        page.click("#sc-dc-result-close")

        open_panel("can-config", "CAN配置", "sc-dc-canconfig-refresh", "sc-dc-canconfig-write")
        config_rows = page.locator("[data-can-config-row]")
        if config_rows.count() != 4:
            raise AssertionError(f"expected 4 CAN config rows, got {config_rows.count()}")
        page.evaluate("() => { window.__requestNames = []; }")
        page.click("#sc-dc-canconfig-refresh")
        page.wait_for_timeout(700)
        request_names = page.evaluate("() => window.__requestNames.slice()")
        expected_config = [
            "CAN_D1_PROTOCOL",
            "CAN_D1_UC_NODE",
            "CAN_D2_PROTOCOL",
            "CAN_D2_UC_NODE",
        ]
        if request_names != expected_config:
            raise AssertionError(f"CAN config refresh path mismatch: {request_names!r}")
        page.click("#sc-dc-result-close")

        config_input = page.locator('[data-can-config-param="CAN_D1_UC_NODE"]')
        config_input.fill("42")
        config_input.dispatch_event("input")
        page.click('[data-can-config-row="CAN_D1_UC_NODE"]')
        if not page.locator('[data-can-config-row="CAN_D1_UC_NODE"]').evaluate("el => el.classList.contains('is-selected')"):
            raise AssertionError("clicked CAN config row should be selected")
        page.click("#sc-dc-canconfig-write")
        page.wait_for_timeout(250)
        sent = page.evaluate("() => window.__sentParams.slice()")
        if sent[-1] != ["CAN_D1_UC_NODE", 42]:
            raise AssertionError(f"CAN config write path mismatch: {sent!r}")
        page.click("#sc-dc-result-close")

        browser.close()

    print("PASS: DroneCAN FC quick panels")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
