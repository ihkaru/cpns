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

      <!-- History Section (Positioned at the top if learning history exists) -->
      <div v-if="state.history.length > 0">
        <h3 class="section-title">
          <span class="material-icons section-title-icon">history</span>
          Riwayat Hasil Belajar
        </h3>

        <!-- Segmented Tab Toggle -->
        <div class="segmented-control-custom" style="margin-bottom: 24px;">
          <button
            :class="['segmented-btn', activeTab === 'cat' ? 'active' : '']"
            @click="activeTab = 'cat'"
          >
            Riwayat CAT SKD
          </button>
          <button
            :class="['segmented-btn', activeTab === 'math' ? 'active' : '']"
            @click="activeTab = 'math'"
          >
            Refleks Kalkulasi
          </button>
        </div>

        <!-- 1. CAT SKD TAB VIEW -->
        <div v-if="activeTab === 'cat'">
          <!-- Aggregated CAT Stats Grid -->
          <div class="history-stats-grid">
            <div class="history-stat-card glass-card accuracy-card">
              <div class="history-stat-header">
                <span class="material-icons" style="color: #0d9488;">track_changes</span>
                <span class="history-stat-title">Akurasi Rata-rata</span>
              </div>
              <div class="history-stat-value">{{ catAverageAccuracy }}%</div>
              <div class="history-stat-subtext">Dari total {{ catHistory.length }} sesi</div>
            </div>
            <div class="history-stat-card glass-card speed-card">
              <div class="history-stat-header">
                <span class="material-icons" style="color: #ea580c;">speed</span>
                <span class="history-stat-title">Rata-rata Waktu</span>
              </div>
              <div class="history-stat-value">{{ catAverageTimePerQuestion }}</div>
              <div class="history-stat-subtext" :style="catPaceStatusStyle">{{ catPaceStatusText }}</div>
            </div>
          </div>

          <div style="margin-bottom: 40px;">
            <div v-if="catHistory.length === 0" class="empty-state-card glass-card" style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 13px;">
              Belum ada riwayat simulasi/latihan CAT SKD.
            </div>
            <div v-else v-for="(item, idx) in catHistory" :key="idx" class="history-row glass-card">
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

        <!-- 2. MATH DRILL TAB VIEW -->
        <div v-else-if="activeTab === 'math'">
          <!-- Aggregated Math Stats Grid -->
          <div class="history-stats-grid">
            <div class="history-stat-card glass-card accuracy-card">
              <div class="history-stat-header">
                <span class="material-icons" style="color: #0d9488;">track_changes</span>
                <span class="history-stat-title">Akurasi Kalkulasi</span>
              </div>
              <div class="history-stat-value">{{ mathAverageAccuracy }}%</div>
              <div class="history-stat-subtext">Dari total {{ mathHistory.length }} sesi</div>
            </div>
            <div class="history-stat-card glass-card speed-card">
              <div class="history-stat-header">
                <span class="material-icons" style="color: #ea580c;">speed</span>
                <span class="history-stat-title">Rata-rata Respon</span>
              </div>
              <div class="history-stat-value">
                {{ mathAverageLatency > 0 ? (mathAverageLatency / 1000).toFixed(2) + 's' : '- s' }}
              </div>
              <div class="history-stat-subtext" :style="mathLatencyStyle">{{ mathLatencyText }}</div>
            </div>
          </div>

          <!-- Cumulative Weak Spots -->
          <div v-if="mathWeakSpotsSummary.length > 0" class="weak-spots-card glass-card" style="margin-bottom: 24px; padding: 20px;">
            <h3 class="weak-spots-title" style="margin: 0 0 8px 0; font-size: 15px; font-weight: 800; display: flex; align-items: center; gap: 8px; color: #fff;">
              <span class="material-icons" style="color: var(--error-color);">warning</span>
              Titik Lemah Refleks Kalkulasi
            </h3>
            <p class="weak-spots-desc" style="margin: 0 0 16px 0; font-size: 12px; color: var(--text-muted);">
              Kombinasi angka yang paling sering salah dijawab atau responnya lambat (>2 detik) secara kumulatif.
            </p>
            <div class="weak-spots-flex" style="display: flex; flex-wrap: wrap; gap: 8px;">
              <div v-for="item in mathWeakSpotsSummary" :key="item.spot" class="weak-spot-pill" style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 20px; font-size: 13px; color: #f87171; font-weight: 700;">
                <span>{{ item.spot }}</span>
                <span style="font-size: 11px; background: rgba(239, 68, 68, 0.2); padding: 2px 6px; border-radius: 10px; color: #fff;">{{ item.count }}x</span>
              </div>
            </div>
          </div>

          <div style="margin-bottom: 40px;">
            <div v-if="mathHistory.length === 0" class="empty-state-card glass-card" style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 13px;">
              Belum ada riwayat latihan refleks kalkulasi cepat.
            </div>
            <div v-else v-for="(item, idx) in mathHistory" :key="idx" class="history-row glass-card">
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
                    {{ parseBreakdown(item)?.avg_latency_ms ? (parseBreakdown(item).avg_latency_ms / 1000).toFixed(2) + 's/soal' : '- s/soal' }}
                  </span>
                </div>
              </div>
              <div class="badge-row">
                <span class="history-points">Skor: {{ item.score }} / {{ item.maxScore }}</span>
                <span :class="['custom-badge', item.passed ? 'badge-success' : 'badge-error']">
                  {{ item.passed ? 'MASTERY' : 'BELUM MASTERY' }}
                </span>
              </div>
            </div>
          </div>
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

      <!-- Math Drill Promo Card -->
      <div class="math-drill-banner premium-banner glass-card" style="background: radial-gradient(circle at top right, rgba(245, 158, 11, 0.15) 0%, rgba(18, 24, 38, 0.8) 70%); border-color: rgba(245, 158, 11, 0.25); margin-bottom: 36px;">
        <div class="banner-content">
          <h2 class="banner-title">Latihan Refleks Numerik</h2>
          <p class="banner-desc">
            Asah kecepatan menghitung dasar (perkalian, pembagian, tambah, kurang) untuk menekan waktu respons hingga di bawah 1.5 detik per soal. Bebaskan otak Anda dari beban kalkulasi manual saat TIU!
          </p>
          <f7-button fill large class="gradient-bg-btn" style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%) !important; box-shadow: 0 4px 15px rgba(234, 88, 12, 0.4);" @click="startMathDrill">
            <span class="material-icons" style="font-size: 20px; margin-right: 8px;">speed</span>
            Mulai Refleks Numerik
          </f7-button>
        </div>
        <div class="banner-visual-wrapper" style="background: rgba(234, 88, 12, 0.08); border-color: rgba(234, 88, 12, 0.2);">
          <span class="material-icons banner-glowing-icon" style="color: #f97316;">bolt</span>
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
import { f7 } from 'framework7-vue';
import { state, startSimulation, selectCategory, logout, leaderboardTop3, coachingRecommendation } from '../store';
import LeaderboardSheet from './LeaderboardSheet.vue';

const showLeaderboard = ref(false);
const appVersion = __APP_VERSION__;
const activeTab = ref<'cat' | 'math'>('cat');

const startMathDrill = () => {
  if (f7.views.main && f7.views.main.router) {
    f7.views.main.router.navigate('/math-drill/');
  }
};

const parseBreakdown = (item: any) => {
  if (!item || !item.breakdown) return null;
  if (typeof item.breakdown === 'string') {
    try {
      return JSON.parse(item.breakdown);
    } catch {
      return null;
    }
  }
  return item.breakdown;
};

// Filtered History
const catHistory = computed(() => {
  return state.history.filter(item => {
    const b = parseBreakdown(item);
    return !b || b.type !== 'math_drill';
  });
});

const mathHistory = computed(() => {
  return state.history.filter(item => {
    const b = parseBreakdown(item);
    return b && b.type === 'math_drill';
  });
});

// CAT Stats Computeds
const catAverageAccuracy = computed(() => {
  if (catHistory.value.length === 0) return 0;
  let totalScore = 0;
  let totalMaxScore = 0;
  catHistory.value.forEach(item => {
    totalScore += item.score || 0;
    totalMaxScore += item.maxScore || 0;
  });
  if (totalMaxScore === 0) return 0;
  return Math.round((totalScore / totalMaxScore) * 100);
});

const catAverageTimePerQuestion = computed(() => {
  let totalSeconds = 0;
  let totalQuestions = 0;
  catHistory.value.forEach(item => {
    if (item.durationSeconds !== undefined && item.durationSeconds !== null) {
      totalSeconds += item.durationSeconds;
      totalQuestions += (item.maxScore || 0) / 5;
    }
  });
  if (totalQuestions === 0) return '- s/soal';
  const avg = totalSeconds / totalQuestions;
  return `${avg.toFixed(1)}s/soal`;
});

const catPaceStatusText = computed(() => {
  let totalSeconds = 0;
  let totalQuestions = 0;
  catHistory.value.forEach(item => {
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

const catPaceStatusStyle = computed(() => {
  let totalSeconds = 0;
  let totalQuestions = 0;
  catHistory.value.forEach(item => {
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

// Math Stats Computeds
const mathAverageAccuracy = computed(() => {
  if (mathHistory.value.length === 0) return 0;
  let totalScore = 0;
  let totalMaxScore = 0;
  mathHistory.value.forEach(item => {
    totalScore += item.score || 0;
    totalMaxScore += item.maxScore || 0;
  });
  if (totalMaxScore === 0) return 0;
  return Math.round((totalScore / totalMaxScore) * 100);
});

const mathAverageLatency = computed(() => {
  let totalLatencyMs = 0;
  let validCount = 0;
  mathHistory.value.forEach(item => {
    const b = parseBreakdown(item);
    if (b && typeof b.avg_latency_ms === 'number') {
      totalLatencyMs += b.avg_latency_ms;
      validCount++;
    }
  });
  if (validCount === 0) return 0;
  return Math.round(totalLatencyMs / validCount);
});

const mathLatencyText = computed(() => {
  const avg = mathAverageLatency.value;
  if (avg === 0) return 'Belum ada data waktu';
  const seconds = avg / 1000;
  if (seconds <= 1.5) {
    return `Sangat Cepat! (Target <1.5s)`;
  } else if (seconds <= 2.5) {
    return `Cukup Baik (Target <1.5s)`;
  } else {
    return `Perlu Ditingkatkan (>2.5s)`;
  }
});

const mathLatencyStyle = computed(() => {
  const avg = mathAverageLatency.value;
  if (avg === 0) return { color: '#71717a' };
  const seconds = avg / 1000;
  if (seconds <= 1.5) {
    return { color: '#4ade80' };
  } else if (seconds <= 2.5) {
    return { color: '#facc15' };
  } else {
    return { color: '#f87171' };
  }
});

// Cumulative Weak Spots Summary
const mathWeakSpotsSummary = computed(() => {
  const counts: Record<string, number> = {};
  mathHistory.value.forEach(item => {
    const b = parseBreakdown(item);
    if (b && Array.isArray(b.weak_spots)) {
      b.weak_spots.forEach((spot: string) => {
        counts[spot] = (counts[spot] || 0) + 1;
      });
    }
  });
  return Object.entries(counts)
    .map(([spot, count]) => ({ spot, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
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

/* Custom segmented control for Dashboard */
.segmented-control-custom {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 4px;
  gap: 4px;
}

.segmented-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  padding: 10px 4px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.segmented-btn:hover {
  background: rgba(255, 255, 255, 0.03);
}

.segmented-btn.active {
  background: var(--primary-color);
  color: #fff;
  box-shadow: 0 4px 12px var(--primary-glow);
}
</style>
