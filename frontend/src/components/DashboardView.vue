<template>
  <f7-page name="dashboard" @page:beforein="state.screen = 'dashboard'">
    <!-- Navbar -->
    <f7-navbar>
      <f7-nav-title>
        <div class="logo-wrapper">
          <span class="logo-title gradient-text">AksaraCAT</span>
          <div class="status-indicator" :class="{ offline: state.isOffline }">
            <span class="pulse-dot"></span>
            <span class="status-text">{{ state.isOffline ? 'Offline Mode' : 'Online' }}</span>
          </div>
        </div>
      </f7-nav-title>
    </f7-navbar>

    <div class="page-container">
      <!-- Hero Section -->
      <div class="hero-section">
        <h1 class="hero-title">Kuasai Ujian <br/><span class="gradient-text">CAT CPNS</span></h1>
        <p class="hero-subtitle">
          Media belajar interaktif mobile-first untuk melatih akurasi dan kecepatan Anda dalam menaklukkan soal-soal SKD (TWK, TIU, TKP) standar BKN.
        </p>

        <!-- Auth Profile Card (Mandatory Flow) -->
        <div v-if="state.user" class="profile-card glass-card">
          <div class="profile-avatar">
            <img :src="state.user.avatarUrl || 'https://lh3.googleusercontent.com/a/default-user=s96-c'" @error="(e: any) => (e.target as HTMLImageElement).src = 'https://lh3.googleusercontent.com/a/default-user=s96-c'" />
          </div>
          <div class="profile-info">
            <div class="profile-name">{{ state.user.name }}</div>
            <div class="profile-email">{{ state.user.email }}</div>
          </div>
          <button class="logout-btn-premium" @click="logout">
            <span class="material-icons">logout</span>
            Keluar
          </button>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card twk-stat glass-card">
          <div class="stat-header">
            <span class="material-icons card-icon-mini twk-color">flag</span>
            <span class="stat-label">Soal TWK</span>
          </div>
          <div class="stat-value">{{ state.counts.TWK }}</div>
        </div>
        <div class="stat-card tiu-stat glass-card">
          <div class="stat-header">
            <span class="material-icons card-icon-mini tiu-color">insights</span>
            <span class="stat-label">Soal TIU</span>
          </div>
          <div class="stat-value">{{ state.counts.TIU }}</div>
        </div>
        <div class="stat-card tkp-stat glass-card">
          <div class="stat-header">
            <span class="material-icons card-icon-mini tkp-color">handshake</span>
            <span class="stat-label">Soal TKP</span>
          </div>
          <div class="stat-value">{{ state.counts.TKP }}</div>
        </div>
        <div class="stat-card done-stat glass-card">
          <div class="stat-header">
            <span class="material-icons card-icon-mini done-color">emoji_events</span>
            <span class="stat-label">Diselesaikan</span>
          </div>
          <div class="stat-value">{{ state.history.length }}</div>
        </div>
      </div>

      <!-- CAT Simulation Banner -->
      <div class="simulation-banner premium-banner glass-card">
        <div class="banner-content">
          <h2 class="banner-title">Simulasi Real CAT SKD</h2>
          <p class="banner-desc">
            Kerjakan 110 soal acak (30 TWK, 35 TIU, 45 TKP) secara blind-mode dalam waktu 100 menit dengan penentuan kelulusan passing grade BKN asli.
          </p>
          <f7-button fill large class="gradient-bg-btn" @click="startSimulation">
            <span class="material-icons" style="font-size: 20px; margin-right: 8px;">play_circle</span>
            Mulai Simulasi CAT
          </f7-button>
        </div>
        <div class="banner-visual-wrapper">
          <span class="material-icons banner-glowing-icon">flash_on</span>
        </div>
      </div>

      <!-- Leaderboard Section (Authenticated Flow) -->
      <div v-if="state.token" class="leaderboard-section-home">
        <h3 class="section-title">
          <span class="material-icons section-title-icon" style="color: var(--warning-color);">emoji_events</span>
          Papan Peringkat Simulasi
        </h3>

        <!-- Podium Top 3 -->
        <div v-if="leaderboardTop3.length > 0" class="podium-wrapper glass-card">
          <div class="podium-container">
            <!-- Rank 2 -->
            <div v-if="leaderboardTop3[1]" class="podium-step step-2">
              <div class="podium-avatar-wrapper">
                <img :src="leaderboardTop3[1].avatarUrl || 'https://lh3.googleusercontent.com/a/default-user=s96-c'" class="podium-avatar" @error="(e: any) => (e.target as HTMLImageElement).src = 'https://lh3.googleusercontent.com/a/default-user=s96-c'" />
                <span class="podium-medal">🥈</span>
              </div>
              <span class="podium-name">{{ leaderboardTop3[1].name }}</span>
              <span class="podium-score">{{ leaderboardTop3[1].score }} pts</span>
            </div>

            <!-- Rank 1 -->
            <div v-if="leaderboardTop3[0]" class="podium-step step-1">
              <div class="podium-avatar-wrapper">
                <img :src="leaderboardTop3[0].avatarUrl || 'https://lh3.googleusercontent.com/a/default-user=s96-c'" class="podium-avatar" @error="(e: any) => (e.target as HTMLImageElement).src = 'https://lh3.googleusercontent.com/a/default-user=s96-c'" />
                <span class="podium-crown">👑</span>
              </div>
              <span class="podium-name">{{ leaderboardTop3[0].name }}</span>
              <span class="podium-score">{{ leaderboardTop3[0].score }} pts</span>
            </div>

            <!-- Rank 3 -->
            <div v-if="leaderboardTop3[2]" class="podium-step step-3">
              <div class="podium-avatar-wrapper">
                <img :src="leaderboardTop3[2].avatarUrl || 'https://lh3.googleusercontent.com/a/default-user=s96-c'" class="podium-avatar" @error="(e: any) => (e.target as HTMLImageElement).src = 'https://lh3.googleusercontent.com/a/default-user=s96-c'" />
                <span class="podium-medal">🥉</span>
              </div>
              <span class="podium-name">{{ leaderboardTop3[2].name }}</span>
              <span class="podium-score">{{ leaderboardTop3[2].score }} pts</span>
            </div>
          </div>
          
          <f7-button fill round class="view-leaderboard-btn" @click="showLeaderboard = true">
            <span class="material-icons" style="font-size: 18px; margin-right: 6px;">leaderboard</span>
            Lihat Detail Papan Peringkat (Top 10)
          </f7-button>
        </div>

        <!-- Coaching Recommendation Card -->
        <div v-if="coachingRecommendation.showCoaching" class="coaching-card glass-card">
          <div class="coaching-header">
            <span class="material-icons coaching-icon">lightbulb</span>
            <span class="coaching-title">{{ coachingRecommendation.title }}</span>
          </div>
          <ul class="coaching-list">
            <li v-for="(tip, i) in coachingRecommendation.tips" :key="i" class="coaching-item">
              <span class="material-icons item-bullet">chevron_right</span>
              <span v-html="tip"></span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Category Selector -->
      <h3 class="section-title">
        <span class="material-icons section-title-icon">explore</span>
        Latihan Mandiri Per Kategori
      </h3>
      
      <div class="category-grid">
        <!-- TWK -->
        <div class="category-card glass-card hover-glow-red">
          <div class="card-icon-wrapper twk-bg">
            <span class="material-icons">flag</span>
          </div>
          <h4 class="card-title">Tes Wawasan Kebangsaan (TWK)</h4>
          <p class="card-desc">Asah pemahaman tentang nasionalisme, integritas, bela negara, pilar negara, dan bahasa Indonesia.</p>
          <f7-button outline round class="card-action-btn twk-btn" @click="selectCategory('TWK')">
            Pilih Paket TWK
          </f7-button>
        </div>
        <!-- TIU -->
        <div class="category-card glass-card hover-glow-orange">
          <div class="card-icon-wrapper tiu-bg">
            <span class="material-icons">insights</span>
          </div>
          <h4 class="card-title">Tes Inteligensia Umum (TIU)</h4>
          <p class="card-desc">Latih kemampuan verbal (analogi, silogisme), numerik (deret, berhitung), dan figural.</p>
          <f7-button outline round class="card-action-btn tiu-btn" @click="selectCategory('TIU')">
            Pilih Paket TIU
          </f7-button>
        </div>
        <!-- TKP -->
        <div class="category-card glass-card hover-glow-green">
          <div class="card-icon-wrapper tkp-bg">
            <span class="material-icons">handshake</span>
          </div>
          <h4 class="card-title">Tes Karakteristik Pribadi (TKP)</h4>
          <p class="card-desc">Uji aspek pelayanan publik, jejaring kerja, sosial budaya, TIK, profesionalisme, dan anti radikalisme.</p>
          <f7-button outline round class="card-action-btn tkp-btn" @click="selectCategory('TKP')">
            Pilih Paket TKP
          </f7-button>
        </div>
      </div>

      <!-- History Section -->
      <div v-if="state.history.length > 0">
        <h3 class="section-title">
          <span class="material-icons section-title-icon">history</span>
          Riwayat Hasil Belajar
        </h3>

        <!-- Aggregated History Stats Grid -->
        <div class="history-stats-grid">
          <div class="history-stat-card glass-card accuracy-card">
            <div class="history-stat-header">
              <span class="material-icons" style="color: #0d9488;">track_changes</span>
              <span class="history-stat-title">Akurasi Rata-rata</span>
            </div>
            <div class="history-stat-value">{{ averageAccuracy }}%</div>
            <div class="history-stat-subtext">Dari total {{ state.history.length }} sesi</div>
          </div>
          <div class="history-stat-card glass-card speed-card">
            <div class="history-stat-header">
              <span class="material-icons" style="color: #ea580c;">speed</span>
              <span class="history-stat-title">Rata-rata Waktu</span>
            </div>
            <div class="history-stat-value">{{ averageTimePerQuestion }}</div>
            <div class="history-stat-subtext" :style="paceStatusStyle">{{ paceStatusText }}</div>
          </div>
        </div>

        <div style="margin-bottom: 40px;">
          <div v-for="(item, idx) in state.history" :key="idx" class="history-row glass-card">
            <div class="history-left">
              <div class="history-info">
                <span class="history-title">{{ item.name }}</span>
                <span class="history-date">{{ item.date }}</span>
              </div>
              <div class="history-meta">
                <span class="meta-item">
                  <span class="material-icons meta-icon">timer</span>
                  {{ formatDuration(item.durationSeconds) }}
                </span>
                <span class="meta-item">
                  <span class="material-icons meta-icon">speed</span>
                  {{ formatPace(item.durationSeconds, item.maxScore) }}
                </span>
              </div>
            </div>
            <div class="badge-row">
              <span class="history-points">Skor: {{ item.score }} / {{ item.maxScore }}</span>
              <span :class="['custom-badge', item.passed ? 'badge-success' : 'badge-error']">
                {{ item.passed ? 'LOLOS' : 'TIDAK LOLOS' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- App Version & Update Link (Fini style) -->
      <div class="app-version-section">
        <div class="app-version-text">AksaraCAT v{{ appVersion }}</div>
        <a
          href="https://github.com/ihkaru/cpns/releases/latest"
          target="_blank"
          class="external app-download-link"
        >
          <span class="material-icons" style="font-size: 14px; margin-right: 4px; color: #a5b4fc;">android</span>
          Unduh APK / Cek Update
        </a>
      </div>
    </div>

    <!-- Leaderboard Sheet Modal overlay -->
    <LeaderboardSheet v-model:opened="showLeaderboard" />
  </f7-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { state, startSimulation, selectCategory, logout, leaderboardTop3, coachingRecommendation } from '../store';
import LeaderboardSheet from './LeaderboardSheet.vue';

const showLeaderboard = ref(false);
const appVersion = __APP_VERSION__;

const averageAccuracy = computed(() => {
  if (state.history.length === 0) return 0;
  let totalScore = 0;
  let totalMaxScore = 0;
  state.history.forEach(item => {
    totalScore += item.score || 0;
    totalMaxScore += item.maxScore || 0;
  });
  if (totalMaxScore === 0) return 0;
  return Math.round((totalScore / totalMaxScore) * 100);
});

const averageTimePerQuestion = computed(() => {
  let totalSeconds = 0;
  let totalQuestions = 0;
  state.history.forEach(item => {
    if (item.durationSeconds !== undefined && item.durationSeconds !== null) {
      totalSeconds += item.durationSeconds;
      totalQuestions += (item.maxScore || 0) / 5;
    }
  });
  if (totalQuestions === 0) return '- s/soal';
  const avg = totalSeconds / totalQuestions;
  return `${avg.toFixed(1)}s/soal`;
});

const paceStatusText = computed(() => {
  let totalSeconds = 0;
  let totalQuestions = 0;
  state.history.forEach(item => {
    if (item.durationSeconds !== undefined && item.durationSeconds !== null) {
      totalSeconds += item.durationSeconds;
      totalQuestions += (item.maxScore || 0) / 5;
    }
  });
  if (totalQuestions === 0) return 'Belum ada data waktu';
  const avg = totalSeconds / totalQuestions;
  if (avg <= 54) {
    return 'Sangat Cepat! (Target BKN <54s)';
  } else if (avg <= 70) {
    return 'Cukup Baik (Target BKN <54s)';
  } else {
    return 'Perlu Ditingkatkan (>54s/soal)';
  }
});

const paceStatusStyle = computed(() => {
  let totalSeconds = 0;
  let totalQuestions = 0;
  state.history.forEach(item => {
    if (item.durationSeconds !== undefined && item.durationSeconds !== null) {
      totalSeconds += item.durationSeconds;
      totalQuestions += (item.maxScore || 0) / 5;
    }
  });
  if (totalQuestions === 0) return { color: '#71717a' };
  const avg = totalSeconds / totalQuestions;
  if (avg <= 54) {
    return { color: '#4ade80' };
  } else if (avg <= 70) {
    return { color: '#facc15' };
  } else {
    return { color: '#f87171' };
  }
});

const formatDuration = (seconds?: number | null) => {
  if (seconds === undefined || seconds === null) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const formatPace = (seconds?: number | null, maxScore?: number) => {
  if (seconds === undefined || seconds === null || !maxScore) return '- s/soal';
  const totalQ = maxScore / 5;
  if (totalQ === 0) return '- s/soal';
  const pace = seconds / totalQ;
  return `${pace.toFixed(1)}s/soal`;
};
</script>

<style scoped>
.app-version-section {
  text-align: center;
  margin-top: 40px;
  padding-bottom: 24px;
  border-top: 1px dashed rgba(255, 255, 255, 0.1);
  padding-top: 24px;
}

.app-version-text {
  font-size: 12px;
  color: var(--text-muted);
  letter-spacing: 0.05em;
  font-weight: 600;
}

.app-download-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 8px;
  font-size: 13px;
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 700;
  transition: var(--transition-smooth);
}

.app-download-link:hover {
  opacity: 0.8;
  text-shadow: 0 0 8px var(--primary-glow);
}
</style>
