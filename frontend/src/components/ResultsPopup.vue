<template>
  <f7-popup :opened="state.showResults" @popup:closed="state.showResults = false">
    <f7-page>
      <f7-navbar title="Hasil Akhir Ujian">
        <f7-nav-right>
          <f7-link popup-close>Tutup</f7-link>
        </f7-nav-right>
      </f7-navbar>
      
      <div style="max-width: 800px; margin: 0 auto; padding: 24px;">
        <div class="results-popup-header">
          <!-- 1. Simulasi CAT Passing Grade Status -->
          <div 
            v-if="state.lastResults.isSim"
            :class="['custom-badge', state.lastResults.passed ? 'badge-success' : 'badge-error']" 
            style="font-size: 16px; padding: 8px 20px; margin-bottom: 16px;"
          >
            {{ state.lastResults.passed ? '✓ LOLOS PASSING GRADE BKN' : '✗ BELUM LOLOS PASSING GRADE BKN' }}
          </div>
          <!-- 2. Latihan Mandiri Target Status -->
          <div 
            v-else
            :class="['custom-badge', state.lastResults.passed ? 'badge-success' : 'badge-warning']" 
            style="font-size: 16px; padding: 8px 20px; margin-bottom: 16px;"
          >
            {{ state.lastResults.passed ? '✓ TARGET TERCAPAI (≥70%)' : '⚠ DI BAWAH TARGET (<70%)' }}
          </div>
          
          <h2 class="results-popup-title">Nilai Akhir: {{ state.lastResults.score }} / {{ state.lastResults.maxScore }}</h2>
          <p style="color: var(--text-secondary); margin-top: 6px; font-size: 14px;">
            Ujian: {{ state.currentSessionName }}
          </p>
        </div>

        <!-- Accuracy Gauges for TWK, TIU, TKP -->
        <div class="results-gauge-container">
          <div v-if="state.lastResults.isSim || hasCategory('TWK')" class="gauge-wrapper">
            <f7-gauge
              type="semicircle"
              :value="gaugeTWKValue"
              :value-text="gaugeTWKPercent"
              border-width="8"
              border-color="#ef4444"
              label-text="TWK"
              size="120"
            />
            <div class="gauge-label">TWK</div>
            <div class="gauge-subtext">Skor: {{ state.lastResults.breakdown.TWK }} / {{ twkMaxPossible }}</div>
          </div>

          <div v-if="state.lastResults.isSim || hasCategory('TIU')" class="gauge-wrapper">
            <f7-gauge
              type="semicircle"
              :value="gaugeTIUValue"
              :value-text="gaugeTIUPercent"
              border-width="8"
              border-color="#f59e0b"
              label-text="TIU"
              size="120"
            />
            <div class="gauge-label">TIU</div>
            <div class="gauge-subtext">Skor: {{ state.lastResults.breakdown.TIU }} / {{ tiuMaxPossible }}</div>
          </div>

          <div v-if="state.lastResults.isSim || hasCategory('TKP')" class="gauge-wrapper">
            <f7-gauge
              type="semicircle"
              :value="gaugeTKPValue"
              :value-text="gaugeTKPPercent"
              border-width="8"
              border-color="#10b981"
              label-text="TKP"
              size="120"
            />
            <div class="gauge-label">TKP</div>
            <div class="gauge-subtext">Skor: {{ state.lastResults.breakdown.TKP }} / {{ tkpMaxPossible }}</div>
          </div>
        </div>

        <!-- 1. Simulasi CAT Breakdown Table (Full BKN standard) -->
        <table v-if="state.lastResults.isSim" class="results-table">
          <thead>
            <tr>
              <th>Kategori Tes</th>
              <th>Skor Anda</th>
              <th>Passing Grade (SKD)</th>
              <th>Status Kelulusan</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Tes Wawasan Kebangsaan (TWK)</td>
              <td><strong>{{ state.lastResults.breakdown.TWK }}</strong></td>
              <td>65</td>
              <td>
                <span :style="{ color: state.lastResults.breakdown.TWK >= 65 ? 'var(--success-color)' : 'var(--error-color)', fontWeight: 'bold' }">
                  {{ state.lastResults.breakdown.TWK >= 65 ? 'Lolos' : 'Tidak Lolos' }}
                </span>
              </td>
            </tr>
            <tr>
              <td>Tes Inteligensia Umum (TIU)</td>
              <td><strong>{{ state.lastResults.breakdown.TIU }}</strong></td>
              <td>80</td>
              <td>
                <span :style="{ color: state.lastResults.breakdown.TIU >= 80 ? 'var(--success-color)' : 'var(--error-color)', fontWeight: 'bold' }">
                  {{ state.lastResults.breakdown.TIU >= 80 ? 'Lolos' : 'Tidak Lolos' }}
                </span>
              </td>
            </tr>
            <tr>
              <td>Tes Karakteristik Pribadi (TKP)</td>
              <td><strong>{{ state.lastResults.breakdown.TKP }}</strong></td>
              <td>166</td>
              <td>
                <span :style="{ color: state.lastResults.breakdown.TKP >= 166 ? 'var(--success-color)' : 'var(--error-color)', fontWeight: 'bold' }">
                  {{ state.lastResults.breakdown.TKP >= 166 ? 'Lolos' : 'Tidak Lolos' }}
                </span>
              </td>
            </tr>
            <tr style="background: rgba(255, 255, 255, 0.02);">
              <td><strong>Total Akumulasi</strong></td>
              <td><strong style="color: var(--primary-color); font-size: 16px;">{{ state.lastResults.score }}</strong></td>
              <td>311</td>
              <td>
                <span :style="{ color: state.lastResults.passed ? 'var(--success-color)' : 'var(--error-color)', fontWeight: 'bold' }">
                  {{ state.lastResults.passed ? 'Lolos PG' : 'Tidak Lolos PG' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- 2. Latihan Mandiri Breakdown Table (Simplified - Categories Practiced Only) -->
        <table v-else class="results-table">
          <thead>
            <tr>
              <th>Kategori Latihan</th>
              <th>Skor / Maksimal</th>
              <th>Persentase Benar</th>
              <th>Target Kelulusan (70%)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="hasCategory('TWK')">
              <td>Tes Wawasan Kebangsaan (TWK)</td>
              <td><strong>{{ state.lastResults.breakdown.TWK }}</strong> / {{ twkMaxPossible }}</td>
              <td>{{ Math.round((state.lastResults.breakdown.TWK / twkMaxPossible) * 100) }}%</td>
              <td>
                <span :style="{ color: (state.lastResults.breakdown.TWK / twkMaxPossible) >= 0.7 ? 'var(--success-color)' : 'var(--warning-color)', fontWeight: 'bold' }">
                  {{ (state.lastResults.breakdown.TWK / twkMaxPossible) >= 0.7 ? 'Tercapai' : 'Belum Tercapai' }}
                </span>
              </td>
            </tr>
            <tr v-if="hasCategory('TIU')">
              <td>Tes Inteligensia Umum (TIU)</td>
              <td><strong>{{ state.lastResults.breakdown.TIU }}</strong> / {{ tiuMaxPossible }}</td>
              <td>{{ Math.round((state.lastResults.breakdown.TIU / tiuMaxPossible) * 100) }}%</td>
              <td>
                <span :style="{ color: (state.lastResults.breakdown.TIU / tiuMaxPossible) >= 0.7 ? 'var(--success-color)' : 'var(--warning-color)', fontWeight: 'bold' }">
                  {{ (state.lastResults.breakdown.TIU / tiuMaxPossible) >= 0.7 ? 'Tercapai' : 'Belum Tercapai' }}
                </span>
              </td>
            </tr>
            <tr v-if="hasCategory('TKP')">
              <td>Tes Karakteristik Pribadi (TKP)</td>
              <td><strong>{{ state.lastResults.breakdown.TKP }}</strong> / {{ tkpMaxPossible }}</td>
              <td>{{ Math.round((state.lastResults.breakdown.TKP / tkpMaxPossible) * 100) }}%</td>
              <td>
                <span :style="{ color: (state.lastResults.breakdown.TKP / tkpMaxPossible) >= 0.7 ? 'var(--success-color)' : 'var(--warning-color)', fontWeight: 'bold' }">
                  {{ (state.lastResults.breakdown.TKP / tkpMaxPossible) >= 0.7 ? 'Tercapai' : 'Belum Tercapai' }}
                </span>
              </td>
            </tr>
            <tr style="background: rgba(255, 255, 255, 0.02);">
              <td><strong>Total Hasil</strong></td>
              <td><strong style="color: var(--primary-color); font-size: 16px;">{{ state.lastResults.score }}</strong> / {{ state.lastResults.maxScore }}</td>
              <td>{{ Math.round((state.lastResults.score / state.lastResults.maxScore) * 100) }}%</td>
              <td>
                <span :style="{ color: state.lastResults.passed ? 'var(--success-color)' : 'var(--warning-color)', fontWeight: 'bold' }">
                  {{ state.lastResults.passed ? 'Lolos Target' : 'Belum Lolos' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Options buttons at bottom of popup -->
        <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 24px;">
          <f7-button fill large class="gradient-bg-btn" @click="goToReview" style="display: flex; align-items: center; justify-content: center; gap: 6px;">
            <span class="material-icons" style="font-size: 20px;">search</span>
            <span>Tinjau Jawaban & Pembahasan Soal</span>
          </f7-button>
          <f7-button outline large round @click="goToDashboard" class="card-action-btn twk-btn" style="display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 4px;">
            <span class="material-icons" style="font-size: 20px;">home</span>
            <span>Kembali ke Dashboard Utama</span>
          </f7-button>
        </div>
      </div>
    </f7-page>
  </f7-popup>
</template>

<script setup lang="ts">
import { f7 } from 'framework7-vue';
import { 
  state, 
  twkMaxPossible, 
  tiuMaxPossible, 
  tkpMaxPossible, 
  gaugeTWKValue, 
  gaugeTIUValue, 
  gaugeTKPValue, 
  gaugeTWKPercent, 
  gaugeTIUPercent, 
  gaugeTKPPercent, 
  resetExamState 
} from '../store';

const hasCategory = (cat: string) => {
  return state.currentQuestions.some(q => q.category === cat);
};

const goToReview = () => {
  state.showResults = false;
  state.currentQuestionIndex = 0;
  if (f7.views.main && f7.views.main.router) {
    f7.views.main.router.navigate('/review/');
  }
};

const goToDashboard = () => {
  state.showResults = false;
  resetExamState();
  if (f7.views.main && f7.views.main.router) {
    f7.views.main.router.navigate('/');
  }
};
</script>
