#!/usr/bin/env bash
# setup_emulator.sh — Run this ONCE after sdkmanager download is done
# Sets up Android emulator with mitmproxy cert injection

set -e

ANDROID_SDK_ROOT="$HOME/Android/Sdk"
export PATH="$PATH:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$ANDROID_SDK_ROOT/platform-tools:$ANDROID_SDK_ROOT/emulator:$HOME/.local/bin"

AVD_NAME="cpns_avd"
PROXY_PORT=8080
MITM_CERT="$HOME/.mitmproxy/mitmproxy-ca-cert.pem"

echo "=== Step 1: Create AVD (API 28, x86_64) ==="
avdmanager create avd \
  -n "$AVD_NAME" \
  -k "system-images;android-28;default;x86_64" \
  --device "pixel_2" \
  --force

echo "=== Step 2: Start emulator with writable system + no boot animation ==="
"$ANDROID_SDK_ROOT/emulator/emulator" \
  -avd "$AVD_NAME" \
  -writable-system \
  -no-snapshot-save \
  -no-boot-anim \
  -gpu swiftshader_indirect &

EMULATOR_PID=$!
echo "Emulator PID: $EMULATOR_PID"

echo "=== Step 3: Wait for emulator to boot ==="
adb wait-for-device
echo "Device detected, waiting for boot to complete..."
while [ "$(adb shell getprop sys.boot_completed 2>/dev/null)" != "1" ]; do
  echo "  Still booting..."
  sleep 5
done
echo "Emulator fully booted!"

echo "=== Step 4: Generate mitmproxy CA cert (if not exists) ==="
if [ ! -f "$MITM_CERT" ]; then
  echo "Generating mitmproxy cert..."
  mitmdump --listen-port 9999 &
  MITM_PID=$!
  sleep 3
  kill $MITM_PID 2>/dev/null || true
  sleep 1
fi

echo "=== Step 5: Inject mitmproxy cert into system trust store ==="
adb root
sleep 2
adb remount
sleep 1

# Get cert hash (Android uses subject hash as filename)
CERT_HASH=$(openssl x509 -inform PEM -subject_hash_old -in "$MITM_CERT" | head -1)
echo "Cert hash: $CERT_HASH"

adb push "$MITM_CERT" "/system/etc/security/cacerts/${CERT_HASH}.0"
adb shell chmod 644 "/system/etc/security/cacerts/${CERT_HASH}.0"
echo "Cert injected!"

echo "=== Step 6: Set proxy to mitmproxy ==="
# Get host IP (the one emulator uses to reach host)
HOST_IP=$(adb shell ip route | grep default | awk '{print $3}' | head -1)
if [ -z "$HOST_IP" ]; then
  HOST_IP="10.0.2.2"  # Android emulator default gateway
fi
echo "Host IP for proxy: $HOST_IP"
adb shell settings put global http_proxy "${HOST_IP}:${PROXY_PORT}"
echo "Proxy set!"

echo "=== Step 7: Install APK ==="
adb install-multiple \
  /home/ihza/projects/cpns/xapk_extracted/com.cimolet.cpnssoal.apk \
  /home/ihza/projects/cpns/xapk_extracted/config.xhdpi.apk \
  /home/ihza/projects/cpns/xapk_extracted/config.in.apk

echo ""
echo "=============================================="
echo " SETUP COMPLETE!"
echo "=============================================="
echo ""
echo "Now run in a SEPARATE terminal:"
echo "  ~/.local/bin/mitmdump -s /home/ihza/projects/cpns/save_soal.py --listen-port 8080"
echo ""
echo "Then in the emulator, open the CPNS app and browse:"
echo "  - TWK soal (all packets)"
echo "  - TIU soal (all packets)"
echo "  - TKP soal (all packets)"
echo "  - PPPK soal (if available)"
echo ""
echo "Captured data will be in: /home/ihza/projects/cpns/captured/"
