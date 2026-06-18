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

          <!-- CAT Target Safe Zone Feedback Alert -->
          <div class="glass-card" style="padding: 16px 20px; margin-bottom: 24px; border: 1px solid rgba(255, 255, 255, 0.08); background: rgba(18, 24, 38, 0.4); text-align: left;">
            <div style="display: flex; align-items: flex-start; gap: 12px;">
              <span class="material-icons" :style="{ color: catBestScore >= 400 ? 'var(--success-color)' : 'var(--warning-color)', fontSize: '24px', marginTop: '2px' }">
                {{ catBestScore >= 400 ? 'check_circle' : 'info' }}
              </span>
              <div style="flex-grow: 1;">
                <div style="font-size: 14px; font-weight: 800; color: #fff; margin-bottom: 4px;">
                  Zona Aman Target SKD CPNS: 400+ Poin
                </div>
                <p style="margin: 0; font-size: 13px; color: var(--text-secondary); line-height: 1.4;">
                  <span v-if="catBestScore === 0">
                    Anda belum menyelesaikan Ujian CAT. Mulai simulasi untuk mengukur kesiapan Anda menuju target zona aman **400+**.
                  </span>
                  <span v-else-if="catBestScore < 400">
                    Skor terbaik Anda saat ini adalah **{{ catBestScore }}**. Anda masih butuh **{{ 400 - catBestScore }}** poin lagi untuk mencapai target zona aman kelulusan BKN (**400+**). Semangat, terus tingkatkan latihan!
                  </span>
                  <span v-else>
                    Luar biasa! Skor terbaik Anda (**{{ catBestScore }}**) sudah berada di **Zona Aman (400+)**. Pertahankan konsistensi dan manajemen waktu Anda agar sukses saat tes resmi!
                  </span>
                </p>
              </div>
            </div>
          </div>

          <!-- CAT Score Trend Line Chart -->
          <div v-if="catChartData" class="glass-card" style="padding: 20px; margin-bottom: 24px;">
            <h4 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 800; color: #fff; display: flex; align-items: center; gap: 6px;">
              <span class="material-icons" style="color: var(--primary-color);">show_chart</span>
              Tren Skor Ujian CAT (10 Sesi Terakhir)
            </h4>
            <TrendChart
              :chart-data="catChartData"
              line-color="#6366f1"
              gradient-id="catLineGrad"
              gradient-start-color="rgba(99, 102, 241, 0.4)"
              gradient-end-color="rgba(99, 102, 241, 0)"
              target-label="Target Aman BKN (400)"
              :y-labels="['550', '275', '0']"
              value-key="score"
            />
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

          <!-- Math Latency Trend Line Chart -->
          <div v-if="mathChartData" class="glass-card" style="padding: 20px; margin-bottom: 24px;">
            <h4 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 800; color: #fff; display: flex; align-items: center; gap: 6px;">
              <span class="material-icons" style="color: var(--primary-color);">show_chart</span>
              Tren Latensi Respons Kalkulasi (10 Sesi Terakhir - Lebih Rendah Lebih Cepat)
            </h4>
            <TrendChart
              :chart-data="mathChartData"
              line-color="#f97316"
              gradient-id="mathLineGrad"
              gradient-start-color="rgba(249, 115, 22, 0.4)"
              gradient-end-color="rgba(249, 115, 22, 0)"
              target-label="Target Refleks BKN (1.5s)"
              :y-labels="['5.0s', '2.5s', '0s']"
              value-key="latency"
            />
          </div>

          <!-- Cumulative Weak Spots -->
          <div v-if="mathWeakSpotsSummary.length > 0" class="weak-spots-card glass-card" style="margin-bottom: 24px; padding: 20px;">
            <h3 class="weak-spots-title" style="margin: 0 0 8px 0; font-size: 15px; font-weight: 800; display: flex; align-items: center; gap: 8px; color: #fff;">
              <span class="material-icons" style="color: var(--error-color);">warning</span>
              Titik Lemah Refleks Kalkulasi
            </h3>
            <p class="weak-spots-desc" style="margin: 0 0 16px 0; font-size: 12px; color: var(--text-muted);">
              Kombinasi angka yang paling sering salah dijawab atau responnya lambat (melebihi target batas waktu kesulitan) secara kumulatif. Ketuk untuk latih ulang kelemahan Anda.
            </p>
            <div class="weak-spots-flex" style="display: flex; flex-wrap: wrap; gap: 8px;">
              <div
                v-for="item in mathWeakSpotsSummary"
                :key="item.spot"
                class="weak-spot-pill"
                style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 20px; font-size: 13px; color: #f87171; font-weight: 700; cursor: pointer; transition: var(--transition-smooth);"
                title="Ketuk untuk latih ulang kelemahan ini"
                @click="retryWeakSpot(item.spot)"
                @mouseover="(e) => (e.currentTarget as HTMLElement).style.background = 'rgba(239, 68, 68, 0.2)'"
                @mouseleave="(e) => (e.currentTarget as HTMLElement).style.background = 'rgba(239, 68, 68, 0.1)'"
              >
                <span>{{ item.spot }}</span>
                <span style="font-size: 11px; background: rgba(239, 68, 68, 0.2); padding: 2px 6px; border-radius: 10px; color: #fff;">{{ item.count }}x</span>
                <span class="material-icons" style="font-size: 14px; margin-left: 2px; color: rgba(255, 255, 255, 0.6);">play_circle</span>
              </div>
            </div>
          </div>

          <!-- Saran Rekomendasi Latihan -->
          <div class="glass-card" style="margin-bottom: 24px; padding: 20px; border: 1px solid rgba(255, 255, 255, 0.08); background: rgba(18, 24, 38, 0.3);">
            <h3 style="margin: 0 0 8px 0; font-size: 15px; font-weight: 800; display: flex; align-items: center; gap: 8px; color: #fff;">
              <span class="material-icons" style="color: var(--warning-color);">lightbulb</span>
              Rekomendasi Latihan
            </h3>
            <p style="margin: 0 0 16px 0; font-size: 12px; color: var(--text-muted);">
              Pilih program latihan berikut untuk mengasah bagian yang membutuhkan peningkatan.
            </p>
            <div style="display: grid; grid-template-columns: 1fr; gap: 10px;">
              <div
                v-for="rec in mathRecommendations"
                :key="rec.title"
                class="glass-card"
                style="padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: var(--transition-smooth); border: 1px solid rgba(255, 255, 255, 0.04); background: rgba(255, 255, 255, 0.01);"
                @click="startPresetDrill(rec.preset)"
                @mouseover="(e) => (e.currentTarget as HTMLElement).style.borderColor = 'var(--primary-color)'"
                @mouseleave="(e) => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255, 255, 255, 0.04)'"
              >
                <div style="text-align: left;">
                  <div style="font-size: 13px; font-weight: 800; color: #fff;">{{ rec.title }}</div>
                  <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">{{ rec.desc }}</div>
                </div>
                <span class="material-icons" style="color: var(--primary-color); font-size: 20px;">play_arrow</span>
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
import { ref, computed } from 'vue';
import { f7 } from 'framework7-vue';
import {
  state,
  startSimulation,
  selectCategory,
  logout,
  leaderboardTop3,
  coachingRecommendation,
  catHistory,
  mathHistory,
  catAverageAccuracy,
  catAverageTimePerQuestion,
  catPaceStatusText,
  catPaceStatusStyle,
  catBestScore,
  catChartData,
  mathAverageAccuracy,
  mathAverageLatency,
  mathLatencyText,
  mathLatencyStyle,
  mathWeakSpotsSummary,
  mathChartData,
  parseBreakdown
} from '../store';
import LeaderboardSheet from './LeaderboardSheet.vue';
import TrendChart from './TrendChart.vue';

const showLeaderboard = ref(false);
const appVersion = __APP_VERSION__;
const activeTab = ref<'cat' | 'math'>('cat');

const startMathDrill = () => {
  if (f7.views.main && f7.views.main.router) {
    f7.views.main.router.navigate('/math-drill/');
  }
};

const retryWeakSpot = (spot: string) => {
  let operation: 'perkalian' | 'pembagian' | 'penjumlahan' | 'pengurangan' = 'perkalian';
  let ranges: number[] = [];
  let difficulty: 'easy' | 'medium' | 'hard' = 'easy';
  
  if (spot.includes('×') || spot.includes('x')) {
    operation = 'perkalian';
    const nums = spot.split(/[×x]/).map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    ranges = nums.length > 0 ? nums : [3];
  } else if (spot.includes('÷') || spot.includes('/')) {
    operation = 'pembagian';
    const nums = spot.split(/[÷/]/).map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    ranges = nums.length > 0 ? [nums[1]] : [3];
  } else if (spot.includes('+')) {
    operation = 'penjumlahan';
    const nums = spot.split('+').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    const maxVal = Math.max(...nums);
    if (maxVal > 100) difficulty = 'hard';
    else if (maxVal > 20) difficulty = 'medium';
    else difficulty = 'easy';
  } else if (spot.includes('−') || spot.includes('-')) {
    operation = 'pengurangan';
    const nums = spot.split(/[−-]/).map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    const maxVal = Math.max(...nums);
    if (maxVal > 100) difficulty = 'hard';
    else if (maxVal > 20) difficulty = 'medium';
    else difficulty = 'easy';
  }
  
  state.mathDrillPreset = {
    operation,
    selectedRanges: ranges,
    difficulty,
    count: 10,
    timeLimit: 0,
    autoStart: true
  };
  
  startMathDrill();
};

const startPresetDrill = (preset: any) => {
  state.mathDrillPreset = preset;
  startMathDrill();
};

const mathRecommendations = computed(() => {
  return [
    {
      title: 'Tingkatkan Kecepatan Perkalian (7, 8, 9)',
      desc: 'Latih perkalian angka besar yang paling sering memicu keterlambatan respons.',
      preset: { operation: 'perkalian', selectedRanges: [7, 8, 9], difficulty: 'easy', count: 15, timeLimit: 0, autoStart: true }
    },
    {
      title: 'Drill Pembagian Acak (Bawah 10)',
      desc: 'Pertajam pembagian dasar untuk mempercepat estimasi hasil pecahan di TIU.',
      preset: { operation: 'pembagian', selectedRanges: [3, 4, 6, 7, 8, 9], difficulty: 'easy', count: 15, timeLimit: 0, autoStart: true }
    },
    {
      title: 'Drill Penjumlahan Sedang (2-Digit)',
      desc: 'Latih penambahan puluhan cepat tanpa corat-coret kertas cakar.',
      preset: { operation: 'penjumlahan', selectedRanges: [], difficulty: 'medium', count: 15, timeLimit: 0, autoStart: true }
    },
    {
      title: 'Drill Campuran Kilat (Batas 3s)',
      desc: 'Program intensif: 20 soal campuran dengan batas waktu ketat 3 detik per soal.',
      preset: { operation: 'campuran', selectedRanges: [2, 3, 4, 5, 6, 7, 8, 9, 10], difficulty: 'easy', count: 20, timeLimit: 3, autoStart: true }
    }
  ];
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
