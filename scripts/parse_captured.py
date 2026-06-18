"""
Parse captured JSON files from mitmproxy and generate bank_soal.sql
Run after: mitmdump -s save_soal.py captures data from the CPNS app

Usage: python3 parse_captured.py
"""
import json
import os
import glob
import re
import sys

CAPTURED_DIR = "/home/ihza/projects/cpns/scripts/captured"
OUTPUT_SQL = "/home/ihza/projects/cpns/scripts/bank_soal_cpns.sql"
OUTPUT_JSON = "/home/ihza/projects/cpns/scripts/bank_soal_cpns.json"


def clean_html(text):
    """Remove basic HTML tags from text."""
    if not text:
        return ""
    text = re.sub(r"<[^>]+>", "", str(text))
    text = text.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
    text = text.replace("&nbsp;", " ").replace("&#39;", "'").replace("&quot;", '"')
    return text.strip()


def escape_sql(text):
    """Escape single quotes for SQL."""
    if text is None:
        return "NULL"
    return "'" + str(text).replace("'", "''") + "'"


def detect_category(data, url, fpath=""):
    """Try to detect TWK/TIU/TKP from the response, URL, or filename."""
    # First try content-based detection
    if isinstance(data, dict):
        if "records" in data and isinstance(data["records"], list) and len(data["records"]) > 0:
            first_item = data["records"][0]
            if isinstance(first_item, dict):
                if "kelompok_soal" in first_item and first_item["kelompok_soal"]:
                    return str(first_item["kelompok_soal"]).upper()
                if "_category" in first_item and first_item["_category"]:
                    return str(first_item["_category"]).upper()
                if "kategori" in first_item and first_item["kategori"]:
                    return str(first_item["kategori"]).upper()
        
        for key in ["kategori", "category", "jenis", "tipe", "type"]:
            if key in data and data[key]:
                val = str(data[key]).upper()
                if "TWK" in val:
                    return "TWK"
                if "TIU" in val:
                    return "TIU"
                if "TKP" in val:
                    return "TKP"
                if "SKB" in val:
                    return "SKB"

    # Try detecting from URL
    url_lower = url.lower() if url else ""
    if "twk" in url_lower:
        return "TWK"
    if "tiu" in url_lower:
        return "TIU"
    if "tkp" in url_lower:
        return "TKP"
    if "pppk" in url_lower:
        return "PPPK"
    if "skb" in url_lower:
        return "SKB"

    # Try detecting from filename
    fname_lower = os.path.basename(fpath).lower() if fpath else ""
    if "twk" in fname_lower:
        return "TWK"
    if "tiu" in fname_lower:
        return "TIU"
    if "tkp" in fname_lower:
        return "TKP"
    if "skb" in fname_lower:
        return "SKB"
    if "tryout_skd" in fname_lower:
        # Tryout SKD biasanya berisi campuran atau kategori tertentu. Kita biarkan deteksi per soal jika ada.
        return "SKD"

    return "UMUM"


def parse_soal_item(item, category, soal_id_start):
    """Try to extract question data from various JSON shapes."""
    soals = []

    # Detect category from item fields to overwrite file-level category if present
    item_cat = item.get("kelompok_soal") or item.get("kategori") or item.get("category") or item.get("jenis_soal") or item.get("_category")
    if item_cat:
        item_cat_str = str(item_cat).upper()
        if "TWK" in item_cat_str:
            category = "TWK"
        elif "TIU" in item_cat_str:
            category = "TIU"
        elif "TKP" in item_cat_str:
            category = "TKP"
        elif "SKB" in item_cat_str:
            category = "SKB"

    # Common field name variants
    q_fields = ["soal", "pertanyaan", "question", "text", "content", "body"]
    a_fields = ["jawaban", "answer", "kunci", "correct", "kunci_jawaban"]
    options_fields = ["pilihan", "options", "choices", "jawaban_list"]
    a_fields_map = {
        "a": ["a", "opsi_a", "pilihan_a", "option_a", "jawaban_a"],
        "b": ["b", "opsi_b", "pilihan_b", "option_b", "jawaban_b"],
        "c": ["c", "opsi_c", "pilihan_c", "option_c", "jawaban_c"],
        "d": ["d", "opsi_d", "pilihan_d", "option_d", "jawaban_d"],
        "e": ["e", "opsi_e", "pilihan_e", "option_e", "jawaban_e"],
    }
    discuss_fields = ["pembahasan", "explanation", "alasan", "diskusi", "discuss", "keterangan_pembahasan"]

    soal_text = None
    for f in q_fields:
        if f in item and item[f]:
            soal_text = clean_html(item[f])
            break
    if not soal_text:
        return soals

    # Get answer options
    opts = {}
    for letter, field_names in a_fields_map.items():
        for fn in field_names:
            if fn in item and item[fn]:
                opts[letter.upper()] = clean_html(item[fn])
                break

    # Get correct answer
    kunci = None
    for f in a_fields:
        if f in item and item[f]:
            kunci = str(item[f]).strip().upper()
            # Normalize: sometimes it's "a", "A", "1", etc.
            if kunci in ["1", "A"]:
                kunci = "A"
            elif kunci in ["2", "B"]:
                kunci = "B"
            elif kunci in ["3", "C"]:
                kunci = "C"
            elif kunci in ["4", "D"]:
                kunci = "D"
            elif kunci in ["5", "E"]:
                kunci = "E"
            break

    # Get pembahasan
    pembahasan = None
    for f in discuss_fields:
        if f in item and item[f]:
            pembahasan = clean_html(item[f])
            break

    # Get option scores (defaults to 0, for TKP they are 1-5, for TWK/TIU correct is 5)
    skor_a = int(item.get("skor_a") or 0)
    skor_b = int(item.get("skor_b") or 0)
    skor_c = int(item.get("skor_c") or 0)
    skor_d = int(item.get("skor_d") or 0)
    skor_e = int(item.get("skor_e") or 0)

    # Fallback score if not defined but key is present
    if not (skor_a or skor_b or skor_c or skor_d or skor_e) and kunci:
        k = kunci.lower()
        if k == "a": skor_a = 5
        elif k == "b": skor_b = 5
        elif k == "c": skor_c = 5
        elif k == "d": skor_d = 5
        elif k == "e": skor_e = 5

    soals.append({
        "id": soal_id_start,
        "category": category,
        "soal": soal_text,
        "img_soal": item.get("img_soal") or "",
        "a": opts.get("A", ""),
        "b": opts.get("B", ""),
        "c": opts.get("C", ""),
        "d": opts.get("D", ""),
        "e": opts.get("E", ""),
        "img_a": item.get("img_a") or "",
        "img_b": item.get("img_b") or "",
        "img_c": item.get("img_c") or "",
        "img_d": item.get("img_d") or "",
        "img_e": item.get("img_e") or "",
        "kunci": kunci or "A",
        "jawaban_benar": item.get("jawaban_benar") or item.get("benar") or "",
        "skor_a": skor_a,
        "skor_b": skor_b,
        "skor_c": skor_c,
        "skor_d": skor_d,
        "skor_e": skor_e,
        "pembahasan": pembahasan or "",
        "gambar_pembahasan": item.get("gambar_pembahasan") or item.get("img_pembahasan") or "",
    })
    return soals


def process_captured_files():
    """Process all captured JSON files and extract questions."""
    files = sorted(glob.glob(os.path.join(CAPTURED_DIR, "*.json")))
    print(f"Found {len(files)} captured files")

    all_soals = []
    soal_id = 1
    seen_soals = set()  # Dedup by question text

    for fpath in files:
        try:
            with open(fpath, "r", encoding="utf-8") as f:
                capture = json.load(f)
        except Exception as e:
            print(f"  [SKIP] {fpath}: {e}")
            continue

        url = capture.get("url", "")
        resp_json = capture.get("response_json")

        # Handle raw JSON directly without mitmproxy wrapper
        if resp_json is None:
            if isinstance(capture, dict) and ("records" in capture or "soal" in capture):
                resp_json = capture
            elif isinstance(capture, list):
                resp_json = capture

        if not resp_json:
            print(f"  [SKIP] No JSON content in {os.path.basename(fpath)}")
            continue

        category = detect_category(resp_json, url, fpath)
        print(f"  [PARSE] {os.path.basename(fpath)} → category={category}")

        # Handle various response shapes
        items = []
        if isinstance(resp_json, list):
            items = resp_json
        elif isinstance(resp_json, dict):
            # Try common wrapper keys
            for key in ["data", "soal", "questions", "result", "items", "list", "records"]:
                if key in resp_json and isinstance(resp_json[key], list):
                    items = resp_json[key]
                    # Check if there's category info at wrapper level
                    if "kategori" in resp_json:
                        category = str(resp_json["kategori"]).upper()
                    break
            if not items:
                # Maybe the dict itself is a single question
                items = [resp_json]

        for item in items:
            if not isinstance(item, dict):
                continue
            soals = parse_soal_item(item, category, soal_id)
            for s in soals:
                # Deduplicate
                key = s["soal"][:100]
                if key not in seen_soals:
                    seen_soals.add(key)
                    all_soals.append(s)
                    soal_id += 1

    return all_soals


def generate_sql(soals):
    """Generate SQL file from parsed questions."""
    lines = []
    lines.append("-- Bank Soal CPNS — Generated from app capture")
    lines.append("-- Categories: TWK, TIU, TKP, PPPK, SKB")
    lines.append("")
    lines.append("CREATE TABLE IF NOT EXISTS bank_soal (")
    lines.append("  id INT PRIMARY KEY AUTO_INCREMENT,")
    lines.append("  kategori VARCHAR(10) NOT NULL,")
    lines.append("  soal TEXT NOT NULL,")
    lines.append("  img_soal TEXT,")
    lines.append("  a TEXT,")
    lines.append("  b TEXT,")
    lines.append("  c TEXT,")
    lines.append("  d TEXT,")
    lines.append("  e TEXT,")
    lines.append("  img_a TEXT,")
    lines.append("  img_b TEXT,")
    lines.append("  img_c TEXT,")
    lines.append("  img_d TEXT,")
    lines.append("  img_e TEXT,")
    lines.append("  kunci CHAR(1) NOT NULL,")
    lines.append("  jawaban_benar TEXT,")
    lines.append("  skor_a INT DEFAULT 0,")
    lines.append("  skor_b INT DEFAULT 0,")
    lines.append("  skor_c INT DEFAULT 0,")
    lines.append("  skor_d INT DEFAULT 0,")
    lines.append("  skor_e INT DEFAULT 0,")
    lines.append("  pembahasan TEXT,")
    lines.append("  gambar_pembahasan TEXT")
    lines.append(");")
    lines.append("")
    lines.append("INSERT INTO bank_soal (id, kategori, soal, img_soal, a, b, c, d, e, img_a, img_b, img_c, img_d, img_e, kunci, jawaban_benar, skor_a, skor_b, skor_c, skor_d, skor_e, pembahasan, gambar_pembahasan) VALUES")

    rows = []
    for s in soals:
        row = (
            f"  ({s['id']}, {escape_sql(s['category'])}, {escape_sql(s['soal'])}, {escape_sql(s['img_soal'])}, "
            f"{escape_sql(s['a'])}, {escape_sql(s['b'])}, {escape_sql(s['c'])}, "
            f"{escape_sql(s['d'])}, {escape_sql(s['e'])}, "
            f"{escape_sql(s['img_a'])}, {escape_sql(s['img_b'])}, {escape_sql(s['img_c'])}, {escape_sql(s['img_d'])}, {escape_sql(s['img_e'])}, "
            f"{escape_sql(s['kunci'])}, {escape_sql(s['jawaban_benar'])}, "
            f"{s['skor_a']}, {s['skor_b']}, {s['skor_c']}, {s['skor_d']}, {s['skor_e']}, "
            f"{escape_sql(s['pembahasan'])}, {escape_sql(s['gambar_pembahasan'])})"
        )
        rows.append(row)

    lines.append(",\n".join(rows) + ";")
    return "\n".join(lines)


def main():
    if not os.path.exists(CAPTURED_DIR):
        print(f"ERROR: Captured dir not found: {CAPTURED_DIR}")
        print("Run mitmdump first to capture data from the app.")
        sys.exit(1)

    soals = process_captured_files()
    print(f"\nTotal unique questions extracted: {len(soals)}")

    if not soals:
        print("No questions found. Check the captured JSON files manually.")
        # Print a summary of what was found
        files = glob.glob(os.path.join(CAPTURED_DIR, "*.json"))
        for f in files[:3]:
            with open(f) as fp:
                d = json.load(fp)
            print(f"\n--- {os.path.basename(f)} ---")
            print(f"URL: {d.get('url', 'N/A')}")
            rj = d.get("response_json")
            if rj:
                if isinstance(rj, dict):
                    print(f"Keys: {list(rj.keys())}")
                elif isinstance(rj, list) and rj:
                    print(f"List[{len(rj)}], first item keys: {list(rj[0].keys()) if isinstance(rj[0], dict) else type(rj[0])}")
        return

    # Breakdown by category
    by_cat = {}
    for s in soals:
        by_cat[s["category"]] = by_cat.get(s["category"], 0) + 1
    print("\nBreakdown by category:")
    for cat, cnt in sorted(by_cat.items()):
        print(f"  {cat}: {cnt} soal")

    sql = generate_sql(soals)
    with open(OUTPUT_SQL, "w", encoding="utf-8") as f:
        f.write(sql)
    print(f"\nSQL written to: {OUTPUT_SQL}")

    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(soals, f, ensure_ascii=False, indent=2)
    print(f"JSON written to: {OUTPUT_JSON}")


if __name__ == "__main__":
    main()
