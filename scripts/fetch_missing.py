#!/usr/bin/env python3
"""
fetch_missing.py - Mengunduh paket soal yang belum ada di folder captured/
"""
import requests
import json
import os
import time
import re
from datetime import datetime

CAPTURED_DIR = "captured"

missing = [
    {
        'category': 'TWK',
        'judul': 'Try Out 3 (30 Soal)',
        'url': 'https://script.google.com/macros/s/AKfycbyN6W9jDz_pJ7rHnngYAVAsyHDE3Zq_aP4yxTcQ28-2De9jV6pgYbfZlqVP6pY4cljPQg/exec?action=read',
        'jenis': 'latihan'
    },
    {
        'category': 'TIU',
        'judul': 'Deret 4',
        'url': 'https://script.google.com/macros/s/AKfycbzzjIHRMcFT-IRAOkeeVe-IXzYYvpU_faR1b80OYxDwpAWwm23hp6ng0LMTYTRySbCiFA/exec?action=read',
        'jenis': 'latihan'
    },
    {
        'category': 'TKP',
        'judul': 'Latihan 5',
        'url': 'https://script.google.com/macros/s/AKfycbypxhcTKJKAlYe1kCdBcORJVhXv1CajKXXnBO3KfkQ9V8rCvUcc8CCYf34QNYEt_XlsyA/exec?action=read',
        'jenis': 'latihan'
    },
]

headers = {
    'User-Agent': 'Mozilla/5.0 (Android 11; Mobile; rv:102.0) Gecko/102.0 Firefox/102.0'
}

def url_to_safe_filename(url):
    """Konversi URL ke nama file yang aman"""
    # Ambil bagian path dari URL
    path = url.replace("https://script.google.com", "").replace("/exec?action=read", "")
    safe = re.sub(r'[^a-zA-Z0-9_\-]', '_', path)
    safe = re.sub(r'_+', '_', safe).strip('_')
    ts = int(datetime.now().timestamp() * 1000)
    return f"{ts}_{safe}.json"

os.makedirs(CAPTURED_DIR, exist_ok=True)

success = 0
for p in missing:
    print(f"\n📥 Fetching [{p['category']}] {p['judul']}...")
    try:
        r = requests.get(p['url'], headers=headers, timeout=30, allow_redirects=True)
        r.raise_for_status()
        
        data = r.json()
        records = data.get('records', [])
        print(f"   ✅ Berhasil! {len(records)} soal ditemukan")
        
        # Tambahkan metadata kategori ke setiap soal
        for record in records:
            if 'category' not in record:
                record['_category'] = p['category']
            if 'judul_paket' not in record:
                record['_judul_paket'] = p['judul']
        
        # Simpan ke file
        filename = url_to_safe_filename(p['url'])
        filepath = os.path.join(CAPTURED_DIR, filename)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"   💾 Disimpan ke: {filename}")
        success += 1
        
    except Exception as e:
        print(f"   ❌ Gagal: {e}")
    
    time.sleep(2)

print(f"\n\n{'='*50}")
print(f"Selesai! {success}/{len(missing)} paket berhasil diunduh")
