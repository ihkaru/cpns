<template>
  <f7-page name="review" @page:beforein="state.screen = 'review'">
    <!-- Navbar -->
    <f7-navbar>
      <f7-nav-left>
        <f7-link back href="/">
          <span class="material-icons" style="font-size: 20px; vertical-align: middle;">arrow_back</span>
          <span style="margin-left: 6px; font-weight: 600; vertical-align: middle;">Kembali</span>
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
      <div class="block-title font-bold size-22" style="margin-left:0; margin-bottom: 8px; font-size: 24px; font-weight: 800;">
        Review Hasil Ujian
      </div>
      <p style="color: var(--text-secondary); margin-bottom: 24px;">
        Membahas lembar jawaban Anda. Jawaban Anda disorot warna, dan pembahasan lengkap disertakan di bawah masing-masing soal.
      </p>

      <div class="exam-layout">
        <!-- Question Column -->
        <div class="question-column">
          <div class="question-card" v-if="currentQuestion">
            <div class="question-header">
              <span class="custom-badge badge-primary">
                {{ currentQuestion.category }} - Soal {{ state.currentQuestionIndex + 1 }}
              </span>
              <span class="custom-badge" :class="getPointsForQuestion(currentQuestion) > 0 ? 'badge-success' : 'badge-error'">
                Poin Diperoleh: {{ getPointsForQuestion(currentQuestion) }}
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
                disabled
              >
                <div class="option-letter">{{ opt }}</div>
                <div class="option-text-wrapper">
                  <div class="option-text">{{ currentQuestion[opt.toLowerCase()] }}</div>
                  <img v-if="currentQuestion['img_' + opt.toLowerCase()]" :src="currentQuestion['img_' + opt.toLowerCase()]" class="option-image" @error="e => (e.target as HTMLElement).style.display = 'none'" />
                </div>
              </button>
            </div>

            <!-- Feedback Panel -->
            <div class="feedback-panel">
              <div class="feedback-header">
                <span class="feedback-status status-neutral">
                  Kunci Jawaban: {{ currentQuestion.kunci }}
                </span>
                <span class="feedback-score-badge">
                  Jawaban Anda: {{ state.userAnswers[currentQuestion.id] || 'Tidak Menjawab' }}
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

              <!-- Explanation Block -->
              <div style="margin-top: 12px; font-size: 14px; line-height: 1.6; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 12px;">
                <h4 style="font-weight: 700; color: var(--primary-color); margin-top: 0; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                  <span class="material-icons" style="font-size: 18px; color: var(--warning-color);">lightbulb</span>
                  <span>Pembahasan:</span>
                </h4>
                <div style="white-space: pre-wrap;">{{ currentQuestion.pembahasan || 'Tidak ada penjelasan tertulis.' }}</div>
                <img v-if="currentQuestion.gambar_pembahasan" :src="currentQuestion.gambar_pembahasan" class="question-image" style="margin-top: 12px;" @error="e => (e.target as HTMLElement).style.display = 'none'" />
              </div>
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
            <f7-button large fill class="gradient-bg" style="flex: 1;" @click="exitToMenu">
              Selesai Review
            </f7-button>
          </div>
        </div>

        <!-- Sidebar Grid Navigation -->
        <div class="exam-sidebar">
          <h4 class="sidebar-title" style="display: flex; align-items: center; gap: 6px;">
            <span class="material-icons" style="font-size: 18px; color: var(--primary-color);">grid_on</span>
            <span>Lembar Jawaban</span>
          </h4>
          <div class="answer-grid">
            <button
              v-for="(q, idx) in state.currentQuestions"
              :key="idx"
              :class="[
                'grid-button',
                state.currentQuestionIndex === idx ? 'active' : '',
                isQuestionCorrect(q) ? 'answered' : 'flagged'
              ]"
              style="font-size: 11px;"
              @click="jumpToQuestion(idx)"
            >
              {{ idx + 1 }}
            </button>
          </div>

          <f7-button fill class="gradient-bg" style="width: 100%; margin-top: 16px;" @click="exitToMenu">
            Tutup Review
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
  prevQuestion, 
  nextQuestion, 
  jumpToQuestion, 
  getOptionClass, 
  getPointsForQuestion, 
  exitToMenu 
} from '../store';

const isQuestionCorrect = (q: any): boolean => {
  if (q.category === 'TKP') {
    return !!state.userAnswers[q.id];
  }
  return state.userAnswers[q.id] === q.kunci;
};
</script>

