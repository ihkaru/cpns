"""
mitmproxy addon script — Capture CPNS soal API responses
Usage: mitmdump -s save_soal.py --listen-port 8080
"""
import json
import os
import re
from datetime import datetime
from mitmproxy import http

OUTPUT_DIR = "/home/ihza/projects/cpns/captured"

class SaveSoal:
    def __init__(self):
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        self.count = 0

    def response(self, flow: http.HTTPFlow) -> None:
        host = flow.request.pretty_host
        # Capture from backend servers (script.google or japuan)
        is_backend = any(x in host for x in ["script.google", "japuan.darmajaya.ac.id"])
        if not is_backend:
            return

        self.count += 1
        url = flow.request.pretty_url
        method = flow.request.method
        status = flow.response.status_code

        # Get request body if POST
        try:
            req_body = flow.request.get_text()
        except Exception:
            req_body = ""

        # Get response body
        try:
            resp_body = flow.response.get_text()
        except Exception:
            resp_body = ""

        # Try to parse JSON response
        resp_json = None
        try:
            resp_json = json.loads(resp_body)
        except Exception:
            pass

        # Build record
        record = {
            "capture_time": datetime.now().isoformat(),
            "url": url,
            "method": method,
            "status_code": status,
            "query_params": dict(flow.request.query),
            "request_body": req_body,
            "response_raw": resp_body,
            "response_json": resp_json,
        }

        # Create filename from URL path
        path_clean = re.sub(r"[^a-zA-Z0-9_-]", "_", flow.request.path[:60])
        ts = datetime.now().strftime("%H%M%S")
        fname = f"{ts}_{self.count:04d}_{path_clean}.json"
        fpath = os.path.join(OUTPUT_DIR, fname)

        with open(fpath, "w", encoding="utf-8") as f:
            json.dump(record, f, ensure_ascii=False, indent=2)

        print(f"[SAVED #{self.count}] {method} {url} → {status} → {fname}")
        if resp_json:
            print(f"           Response keys: {list(resp_json.keys()) if isinstance(resp_json, dict) else type(resp_json).__name__}")

addons = [SaveSoal()]
