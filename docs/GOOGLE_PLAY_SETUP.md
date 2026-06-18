# Panduan Publikasi Android: Google Console & App Signing (Juni 2026)

Dokumen ini menjelaskan alur kerja tercepat dan *best-practice* untuk mengonfigurasi autentikasi Google Sign-In (OAuth), membuat kunci tanda tangan aplikasi (*release keystore*), mengunggah ke GitHub Secrets untuk CI/CD, serta merilis aplikasi di Google Play Console.

---

## 🌐 1. Google Cloud Console (OAuth & Google Sign-In)

Agar pengguna aplikasi Android AksaraCAT dapat masuk menggunakan akun Google secara aman, backend Laravel memerlukan verifikasi ID Token yang dikirimkan oleh aplikasi mobile.

### Langkah-Langkah Konfigurasi:
1. **Buat Project**: Buka [Google Cloud Console](https://console.cloud.google.com/) dan buat project baru (atau pilih project yang sudah ada).
2. **OAuth Consent Screen**:
   - Pilih menu **APIs & Services** > **OAuth consent screen**.
   - Pilih **User Type**: **External** (agar semua akun Google di luar organisasi Anda dapat mendaftar).
   - Isi informasi aplikasi yang wajib: Nama Aplikasi (`AksaraCAT`), Email dukungan, dan Kontak developer.
   - Pada halaman **Scopes**, tambahkan cakupan dasar: `openid`, `.../auth/userinfo.profile`, dan `.../auth/userinfo.email`.
   - Pada halaman **Test Users**, daftarkan email Anda dan rekan penguji. *Penting: Selama status aplikasi masih "Testing", hanya email di daftar ini yang bisa masuk.*
3. **Buat Kredensial (Credentials)**:
   - Pilih menu **Credentials** > **Create Credentials** > **OAuth client ID**.
   - **Kredensial 1: Web Application (Wajib untuk Backend & Dev lokal)**
     - **Application type**: Web application.
     - **Name**: `AksaraCAT Web Client`.
     - **Authorized JavaScript origins**: `http://localhost:5173` (lokal) dan domain web produksi Anda (jika ada).
     - **Authorized redirect URIs**: `http://localhost:5173/` dan domain web produksi Anda.
     - Simpan Client ID yang dihasilkan. Masukkan nilai ini ke variabel `.env` backend Anda sebagai `GOOGLE_CLIENT_ID`.
   - **Kredensial 2: Android Client ID (Untuk Native Google Auth)**
     - **Application type**: Android.
     - **Name**: `AksaraCAT Android Client`.
     - **Package name**: `com.aksaracat.app` (Harus persis sama dengan `appId` di `capacitor.config.ts`).
     - **SHA-1 certificate fingerprint**: Masukkan SHA-1 dari keystore rilis Anda (dijelaskan di bawah) atau SHA-1 kunci pengunggahan debug.
     - *Catatan: Jika Anda menggunakan Play App Signing, Anda juga perlu menambahkan kredensial Android tambahan dengan SHA-1 dari App Signing Certificate yang disediakan oleh Google Play Console.*

---

## 🔑 2. Penandatanganan Aplikasi (App Signing Keystore)

Untuk merilis aplikasi di Android, APK/AAB harus ditandatangani secara digital dengan kunci pribadi (keystore).

> [!CAUTION]
> Jangan pernah mengomitekan berkas `.keystore` ke dalam repositori Git publik Anda karena dapat disalahgunakan oleh pihak lain untuk membajak pembaruan aplikasi Anda.

### Cara Tercepat & Aman (Otomatisasi CI/CD):
Kami telah menyediakan skrip pembantu untuk membuat keystore rilis dan meng-encode-nya ke format Base64 yang aman untuk GitHub Secrets.

1. Jalankan skrip di komputer lokal Anda:
   ```bash
   ./scripts/generate-release-key.sh
   ```
2. Skrip akan meminta Anda memasukkan password baru untuk keystore, men-generate file `aksaracat-release.keystore` di lokasi aman, dan mencetak teks Base64 yang panjang di terminal.
3. Buka repositori Anda di GitHub, lalu navigasikan ke **Settings** > **Secrets and variables** > **Actions**.
4. Daftarkan 4 Secret baru berikut:

| Nama Secret | Deskripsi / Nilai |
| :--- | :--- |
| `ANDROID_KEYSTORE_BASE64` | Salin seluruh teks Base64 hasil keluaran dari skrip di atas. |
| `RELEASE_STORE_PASSWORD` | Password keystore yang Anda masukkan saat menjalankan skrip. |
| `RELEASE_KEY_ALIAS` | Isi dengan: `aksaracat-key` |
| `RELEASE_KEY_PASSWORD` | Password key yang Anda masukkan (sama dengan password keystore). |

Setelah rahasia ini terdaftar, GitHub Actions rilis (`build-apk.yml`) akan otomatis mendekode keystore, menandatangani aplikasi secara digital, dan merilis file `.apk` yang valid dan siap diinstal pengguna pada setiap pembuatan Git Tag baru (`v*`).

---

## 📦 3. Google Play Console (Publikasi Tercepat & Best-Practice)

Untuk merilis aplikasi ke publik di Google Play Store:

### Langkah-Langkah Setup:
1. **Daftar Akun Developer**: Buka [Google Play Console](https://play.google.com/console/signup) dan buat akun (memerlukan biaya pendaftaran satu kali sebesar $25).
2. **Buat Aplikasi Baru**:
   - Ketuk **Create app**.
   - Isi Nama Aplikasi (`AksaraCAT`), bahasa utama, kategori **App** (bukan Game), dan pilih **Free**.
   - Setujui deklarasi hukum dan privasi.
3. **Play App Signing (Rekomendasi Utama & Best-Practice)**:
   - Saat membuat rilis pertama, Google Play Console akan menyarankan untuk menggunakan **Google-managed App Signing Key**.
   - **PILIH OPSI INI!** Dengan opsi ini, Anda hanya mengunggah aplikasi yang ditandatangani oleh kunci pengunggahan (*upload key* / keystore yang Anda buat sendiri lewat skrip). Google kemudian akan menandatangani kembali APK dengan kunci distribusi akhir mereka.
   - *Keuntungan*: Jika Anda kehilangan laptop atau file keystore Anda terhapus, Anda cukup meminta Google merestart kunci pengunggahan Anda. Jika Anda mengelola kunci sendiri dan kehilangannya, Anda **selamanya** tidak akan bisa memperbarui aplikasi tersebut di Play Store.

### Jalur Pengujian Tercepat (Menembus Kebijakan Tester Baru):
> [!WARNING]
> Kebijakan Google per akhir tahun 2023 mengharuskan akun developer personal untuk melakukan **Closed Testing** dengan minimal **20 tester aktif selama 14 hari berturut-turut** sebelum diizinkan merilis ke Production.

Jika Anda ingin menghindari aturan 20 tester selama 14 hari tersebut untuk proses pengujian cepat:
- **Gunakan Jalur Internal Testing (Pengujian Internal)**:
  - Buka menu **Testing** > **Internal testing**.
  - Jalur ini **bebas dari kebijakan 20 tester**.
  - Daftarkan email penguji Anda (hingga 100 email).
  - Unggah berkas `.aab` (Android App Bundle) yang diunduh dari rilis GitHub Actions.
  - Penguji dapat mengunduh aplikasi melalui tautan rahasia Play Store secara instan setelah rilis disetujui (biasanya hanya memakan waktu beberapa menit hingga beberapa jam tanpa peninjauan aplikasi yang ketat).
