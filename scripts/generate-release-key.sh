#!/bin/bash
set -e

# AksaraCAT Release Keystore Generator Helper
# Script ini membantu men-generate keystore rilis Android secara aman
# dan mencetak representasi Base64 untuk digunakan di GitHub Secrets.

echo "============================================="
echo "  AksaraCAT Keystore & Secrets Helper Tool   "
echo "============================================="
echo ""

# 1. Prompt for password
read -s -p "Masukkan password baru untuk Keystore & Key (min 6 karakter): " PASS
echo ""
if [ ${#PASS} -lt 6 ]; then
  echo "Error: Password harus memiliki minimal 6 karakter."
  exit 1
fi

read -s -p "Konfirmasi password: " PASS_CONFIRM
echo ""
if [ "$PASS" != "$PASS_CONFIRM" ]; then
  echo "Error: Konfirmasi password tidak cocok."
  exit 1
fi

ALIAS="aksaracat-key"
KEYSTORE_NAME="aksaracat-release.keystore"
KEYSTORE_PATH="frontend/android/app/$KEYSTORE_NAME"

echo ""
echo "Sedang men-generate keystore di: $KEYSTORE_PATH..."

# 2. Run keytool
# Menggunakan input non-interaktif untuk keytool melalui opsi -dname
keytool -genkey -v \
  -keystore "$KEYSTORE_PATH" \
  -alias "$ALIAS" \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass "$PASS" \
  -keypass "$PASS" \
  -dname "CN=AksaraCAT User, OU=AksaraCAT App, O=AksaraCAT, L=Jakarta, S=DKI Jakarta, C=ID"

echo "✔ Keystore berhasil dibuat!"
echo ""

# 3. Base64 encode
echo "Meng-encode Keystore ke format Base64..."
BASE64_STR=$(base64 -w 0 "$KEYSTORE_PATH")
echo "✔ Selesai!"
echo ""

# 4. Show instructions
echo "=========================================================================="
echo "    LANGKAH SETUP GITHUB SECRETS (Buka GitHub Repo > Settings > Secrets)  "
echo "=========================================================================="
echo ""
echo "Tambahkan Repository Secrets berikut ke repositori Anda di GitHub:"
echo ""
echo "1. Nama Secret: ANDROID_KEYSTORE_BASE64"
echo "   Isi Nilai: (Salin teks di bawah ini)"
echo "--------------------------------------------------------------------------"
echo "$BASE64_STR"
echo "--------------------------------------------------------------------------"
echo ""
echo "2. Nama Secret: RELEASE_STORE_PASSWORD"
echo "   Isi Nilai: $PASS"
echo ""
echo "3. Nama Secret: RELEASE_KEY_ALIAS"
echo "   Isi Nilai: $ALIAS"
echo ""
echo "4. Nama Secret: RELEASE_KEY_PASSWORD"
echo "   Isi Nilai: $PASS"
echo ""
echo "=========================================================================="
echo "Catatan: File '$KEYSTORE_PATH' sudah aman diabaikan oleh git (.gitignore)."
echo "Jangan pernah membagikan file keystore atau password ini ke orang lain!"
echo "=========================================================================="
