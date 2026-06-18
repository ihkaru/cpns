<template>
  <f7-page name="latihan" @page:beforein="state.screen = 'latihan'">
    <!-- Navbar -->
    <f7-navbar>
      <f7-nav-left>
        <f7-link icon-f7="arrow_left" @click="exitToMenu">
          <span style="margin-left: 6px; font-weight: 600;">Keluar</span>
        </f7-link>
      </f7-nav-left>
      <f7-nav-title>
        <div class="logo-title gradient-text">AksaraCAT</div>
      </f7-nav-title>
      <f7-nav-right>
        <div class="badge-row" style="margin-right: 12px;">
          <span v-if="state.isOffline" class="custom-badge badge-warning">Offline Mode</span>
          <span v-else class="custom-badge badge-success">Online</span>
        </div>
      </f7-nav-right>
    </f7-navbar>

    <div class="page-container">
      <!-- Progress Bar -->
      <div style="margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; font-size: 13px; color: var(--text-secondary); margin-bottom: 6px; font-weight: 600;">
          <span>Progres Latihan: {{ state.currentQuestionIndex + 1 }} / {{ state.currentQuestions.length }} Soal</span>
          <span>Akurasi: {{ accuracyPercent }}%</span>
        </div>
        <f7-progressbar :progress="((state.currentQuestionIndex + 1) / state.currentQuestions.length) * 100" />
      </div>

      <div class="exam-layout">
        <!-- Question Column -->
        <div class="question-column">
          <div class="question-card" v-if="currentQuestion">
            <div class="question-header">
              <span class="custom-badge badge-primary">
                {{ currentQuestion.category }} - Soal {{ state.currentQuestionIndex + 1 }}
              </span>
              <span v-if="isCurrentQuestionAnswered" :class="['custom-badge', currentQuestionFeedback?.isCorrect ? 'badge-success' : 'badge-error']">
                {{ currentQuestionFeedback?.statusText }}
              </span>
            </div>

            <!-- Question Text and Image -->
            <div class="question-text">{{ currentQuestion.soal }}</div>
            
            <img v-if="currentQuestion.img_soal" :src="currentQuestion.img_soal" class="question-image" @error="e => (e.target as HTMLElement).style.display = 'none'" />

            <!-- Option Buttons -->
            <div class="options-box">
              <button
                v-for="opt in ['A', 'B', 'C', 'D', 'E']"
                :key="opt"
                :class="['option-btn', getOptionClass(opt)]"
                :disabled="isCurrentQuestionAnswered"
                @click="selectOption(opt)"
              >
                <div class="option-letter">{{ opt }}</div>
                <div class="option-text-wrapper">
                  <div class="option-text">{{ currentQuestion[opt.toLowerCase()] }}</div>
                  <img v-if="currentQuestion['img_' + opt.toLowerCase()]" :src="currentQuestion['img_' + opt.toLowerCase()]" class="option-image" @error="e => (e.target as HTMLElement).style.display = 'none'" />
                </div>
              </button>
            </div>

            <!-- Instant Feedback Panel -->
            <div v-if="isCurrentQuestionAnswered && currentQuestionFeedback" class="feedback-panel">
              <div class="feedback-header">
                <span :class="['feedback-status', currentQuestionFeedback.isCorrect ? 'status-correct' : 'status-wrong']">
                  {{ currentQuestionFeedback.isCorrect ? '✓ Jawaban Tepat' : '✗ Kurang Tepat' }}
                </span>
                <span class="feedback-score-badge">
                  Skor Didapat: +{{ currentQuestionFeedback.score }} Poin
                </span>
              </div>

              <!-- TKP Scoring Info -->
              <div v-if="currentQuestion.category === 'TKP'" class="tkp-grades-box">
                <div class="tkp-grades-title">Detail Bobot Nilai Pilihan TKP:</div>
                <div class="tkp-grades-list">
                  <span 
                    v-for="opt in ['A', 'B', 'C', 'D', 'E']" 
                    :key="opt" 
                    :class="['tkp-grade-pill', state.userAnswers[currentQuestion.id] === opt ? 'highlight' : '']"
                  >
                    Opsi {{ opt }}: {{ currentQuestion['skor_' + opt.toLowerCase()] }} Poin
                  </span>
                </div>
              </div>

              <!-- Collapsible Explanation Accordion -->
              <f7-accordion>
                <f7-accordion-item opened>
                  <f7-accordion-toggle class="accordion-title-custom">
                    <span class="material-icons" style="font-size: 18px; margin-right: 6px; vertical-align: middle; color: var(--warning-color);">lightbulb</span>
                    <span style="vertical-align: middle;">Tinjau Pembahasan & Kunci Jawaban</span>
                  </f7-accordion-toggle>
                  <f7-accordion-content>
                    <div style="padding: 10px 0 0 0; font-size: 14px; line-height: 1.6; color: var(--text-primary);">
                      <div style="margin-bottom: 8px;">Kunci Jawaban: <strong style="color: var(--success-color);">{{ currentQuestion.kunci }}</strong></div>
                      <div style="white-space: pre-wrap;">{{ currentQuestion.pembahasan || 'Tidak ada teks pembahasan khusus untuk soal ini.' }}</div>
                      <img v-if="currentQuestion.gambar_pembahasan" :src="currentQuestion.gambar_pembahasan" class="question-image" style="margin-top: 12px;" @error="e => (e.target as HTMLElement).style.display = 'none'" />
                    </div>
                  </f7-accordion-content>
                </f7-accordion-item>
              </f7-accordion>
            </div>
          </div>

          <!-- Navigation buttons -->
          <div style="display: flex; gap: 12px; margin-top: 8px;">
            <f7-button large fill outline style="flex: 1;" :disabled="state.currentQuestionIndex === 0" @click="prevQuestion">
              Sebelumnya
            </f7-button>
            <f7-button large fill style="flex: 1;" v-if="state.currentQuestionIndex < state.currentQuestions.length - 1" @click="nextQuestion">
              Berikutnya
            </f7-button>
            <f7-button large fill class="gradient-bg" style="flex: 1;" v-else @click="confirmSubmit">
              Selesaikan Latihan
            </f7-button>
          </div>
        </div>

        <!-- Sidebar Grid Navigation -->
        <div class="exam-sidebar">
          <h4 class="sidebar-title">
            <span class="material-icons" style="font-size: 18px; margin-right: 6px; vertical-align: middle; color: var(--primary-color);">explore</span>
            <span style="vertical-align: middle;">Navigasi Soal</span>
          </h4>
          <div class="answer-grid">
            <button
              v-for="(q, idx) in state.currentQuestions"
              :key="idx"
              :class="[
                'grid-button',
                state.currentQuestionIndex === idx ? 'active' : '',
                isAnswered(idx) ? 'answered' : ''
              ]"
              @click="jumpToQuestion(idx)"
            >
              {{ idx + 1 }}
            </button>
          </div>

          <f7-button fill class="gradient-bg" style="width: 100%; margin-top: 16px;" @click="confirmSubmit">
            Selesai & Lihat Hasil
          </f7-button>
        </div>
      </div>
    </div>
  </f7-page>
</template>

<script setup lang="ts">
import { 
  state, 
  currentQuestion, 
  isCurrentQuestionAnswered, 
  accuracyPercent, 
  currentQuestionFeedback, 
  prevQuestion, 
  nextQuestion, 
  jumpToQuestion, 
  selectOption, 
  getOptionClass, 
  confirmSubmit,
  exitToMenu
} from '../store';

const isAnswered = (idx: number): boolean => {
  const q: any = state.currentQuestions[idx];
  return q ? !!state.userAnswers[q.id] : false;
};
</script>

