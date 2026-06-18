<template>
  <f7-page no-navbar name="login">
    <div class="login-wrapper">
      <!-- Glow Decor -->
      <div class="glow-bg"></div>

      <div class="login-content">
        <!-- Logo Brand -->
        <div class="brand-section">
          <div class="brand-logo gradient-text">AksaraCAT</div>
          <div class="brand-badge">BKN Standard v2026</div>
        </div>

        <!-- Hero Slogan -->
        <h1 class="hero-title">Kuasai Ujian <br/><span class="gradient-text">CAT CPNS</span></h1>
        <p class="hero-subtitle">
          Platform interaktif mobile-first untuk mengasah akurasi, kecepatan, dan mental menghadapi seleksi SKD resmi.
        </p>

        <!-- Preview Card -->
        <div class="preview-card glass-card">
          <div class="preview-header">
            <span class="material-icons accent-icon">bolt</span>
            <span class="preview-title">Simulasi Standar CAT</span>
          </div>
          <div class="preview-stats">
            <div class="p-stat"><strong>110</strong><span>Soal SKD</span></div>
            <div class="p-divider"></div>
            <div class="p-stat"><strong>100</strong><span>Menit Waktu</span></div>
            <div class="p-divider"></div>
            <div class="p-stat"><strong>Real</strong><span>Passing Grade</span></div>
          </div>
        </div>

        <!-- Action Card (Glassmorphic) -->
        <div class="auth-card glass-card">
          <h3 class="auth-card-title">Masuk Akun</h3>
          <p class="auth-card-desc">
            Hubungkan dengan akun Google untuk menyinkronkan skor, analisis grafis, dan riwayat belajar ke awan.
          </p>

          <div class="auth-actions">
            <GoogleButton label="Masuk dengan Google" @click="handleGoogleLogin" />
            
            <div class="or-separator">
              <span class="line"></span>
              <span class="text">atau</span>
              <span class="line"></span>
            </div>

            <button class="demo-btn" @click="handleDemoLogin">
              <span class="material-icons" style="font-size: 18px; margin-right: 6px;">rocket_launch</span>
              Demo Mode (Cepat)
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div class="login-footer">
          AksaraCAT &copy; 2026 &bull; Secure Cloud Sync Active
        </div>
      </div>
    </div>
  </f7-page>
</template>

<script setup lang="ts">
import { f7 } from 'framework7-vue';
import { state, loginWithGoogleToken } from '../store';
import GoogleButton from './GoogleButton.vue';

const handleGoogleLogin = () => {
  if (!state.googleClientId) {
    f7.dialog.alert("Google OAuth belum dikonfigurasi di backend. Gunakan 'Demo Mode' untuk mencoba login cepat.", "OAuth Belum Aktif");
    return;
  }
  const nonce = Math.random().toString(36).substring(2);
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(state.googleClientId)}&redirect_uri=${encodeURIComponent(window.location.origin + "/")}&response_type=id_token&scope=openid%20email%20profile&nonce=${nonce}`;
  window.location.href = url;
};

const handleDemoLogin = async () => {
  await loginWithGoogleToken('demo-token');
};
</script>

<style scoped>
.login-wrapper {
  position: relative;
  min-height: 100vh;
  background-color: #0b0f19;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 20px;
  overflow: hidden;
}

/* Background Glow Effect */
.glow-bg {
  position: absolute;
  top: -10%;
  left: 50%;
  transform: translateX(-50%);
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0) 70%);
  z-index: 1;
  pointer-events: none;
}

.login-content {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 420px;
  text-align: center;
}

/* Brand Section */
.brand-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  margin-bottom: 24px;
}

.brand-logo {
  font-size: 28px;
  font-weight: 900;
  letter-spacing: -1px;
}

.brand-badge {
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.2);
  color: var(--primary-color);
  font-size: 10px;
  font-weight: 800;
  padding: 3px 10px;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Hero Slogans */
.hero-title {
  font-size: 38px;
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -1px;
  margin-bottom: 12px;
  color: #fff;
}

.hero-subtitle {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 28px;
  padding: 0 16px;
}

/* Preview Card */
.preview-card {
  margin-bottom: 24px;
  padding: 16px;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-bottom: 12px;
}

.accent-icon {
  color: var(--warning-color);
  font-size: 20px;
  animation: pulse 2s infinite;
}

.preview-title {
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.preview-stats {
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.p-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.p-stat strong {
  font-size: 18px;
  font-weight: 800;
  color: #fff;
}

.p-stat span {
  font-size: 10px;
  color: var(--text-secondary);
  font-weight: 600;
  margin-top: 2px;
}

.p-divider {
  width: 1px;
  height: 24px;
  background-color: var(--surface-border);
}

/* Glassmorphic Cards */
.glass-card {
  background: rgba(18, 24, 38, 0.6);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--surface-border);
  border-radius: var(--border-radius-lg);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
}

/* Action Box */
.auth-card {
  padding: 24px 20px;
  margin-bottom: 24px;
}

.auth-card-title {
  font-size: 18px;
  font-weight: 800;
  color: #fff;
  margin-bottom: 8px;
}

.auth-card-desc {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.4;
  margin-bottom: 20px;
}

.auth-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.or-separator {
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 320px;
  margin: 14px 0;
  gap: 12px;
}

.or-separator .line {
  flex-grow: 1;
  height: 1px;
  background-color: var(--surface-border);
}

.or-separator .text {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 600;
  text-transform: uppercase;
}

.demo-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 320px;
  background: transparent;
  color: var(--primary-color);
  border: 1px solid var(--primary-color);
  border-radius: 24px;
  padding: 12px 24px;
  font-family: var(--font-family);
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.demo-btn:hover {
  background: var(--primary-glow);
  box-shadow: 0 4px 12px var(--primary-glow);
  transform: translateY(-1px);
}

.demo-btn:active {
  transform: translateY(0);
}

.login-footer {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 600;
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 0.9; }
  50% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); opacity: 0.9; }
}
</style>
