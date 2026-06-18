import requests
import json
import os
import re
import time

MANIFEST_PATH = "/home/ihza/projects/cpns/scraped_packets_manifest.json"
OUTPUT_DIR = "/home/ihza/projects/cpns/captured"

def clean_filename(name):
    return re.sub(r"[^a-zA-Z0-9_-]", "_", name)

def main():
    if not os.path.exists(MANIFEST_PATH):
        print(f"Error: Manifest file not found at {MANIFEST_PATH}")
        return

    with open(MANIFEST_PATH, "r") as f:
        manifest = json.load(f)

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    total_downloaded = 0
    total_skipped = 0

    for category, packets in manifest.items():
        print(f"\n======================================")
        print(f" SCRAPING CATEGORY: {category}")
        print(f"======================================")
        
        for p in packets:
            judul = p["judul"]
            url = p["url"]
            jenis = p["jenis"]
            
            if jenis == "coming soon" or not url:
                print(f"  [SKIP] {judul} (coming soon / no URL)")
                total_skipped += 1
                continue
                
            # Check if action=read is in URL
            if "action=read" not in url:
                if "?" in url:
                    url += "&action=read"
                else:
                    url += "?action=read"
                    
            print(f"  [FETCH] {judul} -> {url}")
            
            # Create a filename
            fname = f"direct_scraped_{category}_{clean_filename(judul)}.json"
            fpath = os.path.join(OUTPUT_DIR, fname)
            
            try:
                # Add delay to avoid Google rate limit
                time.sleep(1.0)
                
                r = requests.get(url, timeout=20)
                if r.status_code == 200:
                    resp_json = None
                    try:
                        resp_json = r.json()
                    except:
                        pass
                        
                    record = {
                        "capture_time": time.strftime("%Y-%m-%dT%H:%M:%S"),
                        "url": url,
                        "method": "GET",
                        "status_code": r.status_code,
                        "query_params": {"action": "read"},
                        "request_body": "",
                        "response_raw": r.text,
                        "response_json": resp_json,
                    }
                    
                    with open(fpath, "w", encoding="utf-8") as out_f:
                        json.dump(record, out_f, ensure_ascii=False, indent=2)
                        
                    print(f"    [SAVED] -> {fname} ({len(r.text)} bytes)")
                    total_downloaded += 1
                else:
                    print(f"    [ERROR] Status Code {r.status_code}")
            except Exception as e:
                print(f"    [FAILED] Error: {e}")

    print(f"\n======================================")
    print(f" SCRAPING COMPLETED")
    print(f" Total Downloaded: {total_downloaded}")
    print(f" Total Skipped: {total_skipped}")
    print(f"======================================")

if __name__ == "__main__":
    main()
