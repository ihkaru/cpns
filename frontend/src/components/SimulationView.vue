<template>
  <f7-page name="simulasi" @page:beforein="state.screen = 'simulasi'">
    <!-- Navbar -->
    <f7-navbar>
      <f7-nav-left>
        <f7-link @click="exitToMenu">
          <span class="material-icons" style="font-size: 20px; vertical-align: middle;">logout</span>
          <span style="margin-left: 6px; font-weight: 600; vertical-align: middle;">Keluar</span>
        </f7-link>
      </f7-nav-left>
      <f7-nav-title>
        <div class="logo-title gradient-text">AksaraCAT</div>
      </f7-nav-title>
      <f7-nav-right>
        <div class="badge-row" style="margin-right: 12px;">
          <!-- Sticky Timer Countdown for Simulation -->
          <span class="custom-badge badge-error" style="font-family: monospace; font-size: 14px; font-weight: 800; display: inline-flex; align-items: center; gap: 4px;">
            <span class="material-icons" style="font-size: 16px;">schedule</span>
            {{ formatTime(state.timeLeft) }}
          </span>
          <span v-if="state.isOffline" class="custom-badge badge-warning">Offline Mode</span>
          <span v-else class="custom-badge badge-success">Online</span>
        </div>
      </f7-nav-right>
    </f7-navbar>

    <div class="page-container">
      <!-- Progress Bar -->
      <div style="margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; font-size: 13px; color: var(--text-secondary); margin-bottom: 6px; font-weight: 600;">
          <span>Progres Simulasi CAT: Soal ke-{{ state.currentQuestionIndex + 1 }} dari {{ state.currentQuestions.length }}</span>
          <span>Dijawab: {{ Object.keys(state.userAnswers).length }} / {{ state.currentQuestions.length }}</span>
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
              <f7-button 
                outline 
                small 
                :color="isFlagged(state.currentQuestionIndex) ? 'orange' : 'gray'" 
                @click="toggleFlag"
                style="display: inline-flex; align-items: center; gap: 4px;"
              >
                <span class="material-icons" style="font-size: 14px;">flag</span>
                {{ isFlagged(state.currentQuestionIndex) ? 'Ragu-ragu (Ditandai)' : 'Tandai Ragu-ragu' }}
              </f7-button>
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
                @click="selectOption(opt)"
              >
                <div class="option-letter">{{ opt }}</div>
                <div class="option-text-wrapper">
                  <div class="option-text">{{ currentQuestion[opt.toLowerCase()] }}</div>
                  <img v-if="currentQuestion['img_' + opt.toLowerCase()]" :src="currentQuestion['img_' + opt.toLowerCase()]" class="option-image" @error="e => (e.target as HTMLElement).style.display = 'none'" />
                </div>
              </button>
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
              Submit Jawaban
            </f7-button>
          </div>
        </div>

        <!-- Sidebar Grid Navigation -->
        <div class="exam-sidebar">
          <div :class="['text-center', 'font-bold', 'size-22', state.timeLeft < 300 ? 'color-red timer-critical' : 'color-indigo']" style="margin-bottom: 16px; font-variant-numeric: tabular-nums; font-size: 24px; font-weight: 800; text-align: center; display: flex; align-items: center; justify-content: center; gap: 6px;">
            <span class="material-icons" style="font-size: 24px;">schedule</span>
            {{ formatTime(state.timeLeft) }}
          </div>
          
          <h4 class="sidebar-title" style="display: flex; align-items: center; gap: 6px;">
            <span class="material-icons" style="font-size: 18px; color: var(--primary-color);">grid_on</span>
            <span>Lembar Jawaban ({{ state.currentQuestions.length }} Soal)</span>
          </h4>
          
          <div class="answer-grid" style="max-height: 260px;">
            <button
              v-for="(q, idx) in state.currentQuestions"
              :key="idx"
              :class="[
                'grid-button',
                state.currentQuestionIndex === idx ? 'active' : '',
                isFlagged(idx) ? 'flagged' : '',
                isAnswered(idx) && !isFlagged(idx) ? 'answered' : ''
              ]"
              @click="jumpToQuestion(idx)"
            >
              {{ idx + 1 }}
            </button>
          </div>

          <f7-button fill class="gradient-bg" style="width: 100%; margin-top: 16px;" @click="confirmSubmit">
            Submit Jawaban Ujian
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
  selectOption, 
  getOptionClass, 
  toggleFlag, 
  confirmSubmit, 
  formatTime,
  exitToMenu
} from '../store';

const isFlagged = (idx: number): boolean => !!state.flaggedQuestions[idx];

const isAnswered = (idx: number): boolean => {
  const q: any = state.currentQuestions[idx];
  return q ? !!state.userAnswers[q.id] : false;
};
</script>

