# AksaraCAT Development Guidelines & Architecture

Dokumen ini mencatat aturan dan batasan pengembangan project AksaraCAT (frontend Vue 3 + Framework7 v9, backend Laravel 13).

## ⚠️ Aturan Panjang File (Maksimal 700 Baris)
*   **Batas Maksimum**: Tidak boleh ada satu file pun di dalam codebase yang melebihi **700 baris kode** (termasuk tag template, script, dan style).
*   **Modul & Komponen**: Jika suatu file mendekati atau melebihi batas ini, file tersebut **harus segera dipecah** menjadi modul-modul kecil atau komponen Vue terpisah (`components/`) untuk menjaga keterbacaan, kemudahan pengujian, dan modularitas codebase.

## 🏛️ Arsitektur & Teknologi Stack

### 1. Backend (Laravel 13)
*   Berfungsi **hanya sebagai API endpoint** (`/api/soal`, `/api/packets`, `/api/packets/{id}/soal`).
*   Tidak menangani rendering halaman frontend (no Blade/Inertia).
*   Menyediakan database PostgreSQL dengan seeding data soal CAT CPNS yang kaya (mendukung hybrid rendering gambar dan grading pilihan ganda).

### 2. Frontend (Vue 3 + Framework7 v9 + Bun)
*   Menggunakan Framework7 v9 untuk visual hybrid premium.
*   Menggunakan Bun sebagai runtime dan builder (Vite).
*   **Rencana Pemecahan Komponen**:
    Untuk menjaga `App.vue` tetap di bawah 700 baris, antarmuka dipecah menjadi komponen terpisah di `frontend/src/components/`:
    *   `DashboardView.vue`: Halaman utama, statistik, riwayat belajar.
    *   `TopicSelectView.vue`: Pemilihan paket dan kategori soal.
    *   `PracticeView.vue`: Mode Latihan Mandiri (Instant Feedback, penjelasan accordion, TKP grade list).
    *   `SimulationView.vue`: Mode Simulasi CAT (countdown timer, blind mode, lembar jawaban BKN-style).
    *   `ReviewView.vue`: Mode peninjauan jawaban lengkap dengan ralat dan penjelasan.
    *   `ResultsPopup.vue`: Popup full-screen hasil ujian beserta gauge dan tabel passing grade BKN.
*   **State Management (Modular Store)**: 
    Untuk menjaga berkas tetap di bawah 700 baris dan mudah dirawat, central store dipecah menjadi modul-modul kecil berikut:
    *   `src/store.ts`: Berfungsi sebagai entrypoint tunggal (barrel export) yang mengekspor seluruh state, computed, dan action.
    *   `src/state.ts`: Menyimpan konfigurasi parameter `f7params` dan reactive state utama (`state`) dengan interface type-safe `ExamState`.
    *   `src/computeds.ts`: Mengelola seluruh computed properties (misalnya, akurasi, feedback latihan, visual gauge meter, dll).
    *   `src/actions/examActions.ts`: Mengatur alur ujian, simulasi CAT, pemicu timer interval, scoring, dan kalkulasi submit jawaban.
    *   `src/actions/navActions.ts`: Mengatur navigasi soal, seleksi pilihan jawaban, penandaan bendera ragu-ragu, riwayat lokal, dan tombol keluar.
    Ini memastikan komponen Vue tetap mengimpor dari `src/store.ts` seperti biasa tanpa perlu tahu struktur internalnya.

## 🛠️ Script Helper & Otomatisasi

### 1. dump_structure.py
*   **Lokasi**: [dump_structure.py](file:///home/ihza/projects/cpns/scripts/dump_structure.py)
*   **Perintah**: `python3 scripts/dump_structure.py`
*   **Deskripsi**: Mendata seluruh struktur folder repositori, menghitung baris kode per file teks, serta mendeteksi 5 berkas terbesar (untuk mengawasi aturan batas 700 baris). Outputnya disimpan di [repo_structure.txt](file:///home/ihza/projects/cpns/repo_structure.txt).
*   **Manfaat**: Membantu tim developer mengawasi file mana saja yang ukurannya mendekati batas maksimal 700 baris agar bisa langsung direncanakan pemecahannya.

### 2. dev.sh (Development Server Bootstrapper)
*   **Lokasi**: [dev.sh](file:///home/ihza/projects/cpns/dev.sh)
*   **Perintah**: `./dev.sh`
*   **Deskripsi**: Bootstrapper sekali-klik untuk menyalakan lingkungan pengembangan secara seamless:
    1.  Menjalankan kontainer Docker Compose secara background (`db`, `backend`, dan `frontend`).
    2.  Melakukan pengujian kesiapan koneksi database (`pg_isready`) secara berkala hingga 30 detik.
    3.  Menjalankan fresh migrations dan database seeder di Laravel (`php artisan migrate:fresh --seed`).
    4.  Membuka *blocking* logs pada kontainer frontend Vite agar perubahan kode terpantau live.
    5.  Menyediakan trap cleanup otomatis (`Ctrl+C`) untuk mematikan dan membersihkan container secara aman pasca pengerjaan.

### 3. ESLint Flat Config & Typechecking
*   **Linting (ESLint v10+)**:
    *   **Lokasi**: [eslint.config.js](file:///home/ihza/projects/cpns/frontend/eslint.config.js)
    *   **Perintah Cek**: `bun run lint` (atau `docker compose exec frontend bun run lint`)
    *   **Perintah Autofix**: `bun run lint:fix`
    *   **Deskripsi**: Menegakkan standar penulisan kode Vue 3 (`flat/essential`) dan TypeScript (`vueTsConfigs.recommended`) menggunakan setup ESLint Flat Config modern per Juni 2026.
*   **Typechecking (vue-tsc)**:
    *   **Perintah Cek**: `bun x vue-tsc --noEmit`
    *   **Deskripsi**: Melakukan pengecekan tipe statis (static type analysis) pada seluruh kode TypeScript dan berkas Single File Component (SFC) Vue secara ketat sebelum build produksi.

