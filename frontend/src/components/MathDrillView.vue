<template>
  <f7-page name="math-drill" class="math-drill-page" @page:beforein="handleBeforeIn">
    <!-- Navbar -->
    <f7-navbar back-link="Kembali">
      <f7-nav-title>
        <div class="logo-wrapper">
          <span class="logo-title gradient-text">Refleks Numerik</span>
        </div>
      </f7-nav-title>
    </f7-navbar>

    <div class="page-container">
      <!-- 1. SETUP PHASE -->
      <div v-if="phase === 'setup'" class="setup-container">
        <div class="setup-header glass-card">
          <span class="material-icons setup-header-icon">speed</span>
          <h2 class="setup-title">Latih Refleks Berhitung</h2>
          <p class="setup-desc">
            Banyak kegagalan TIU disebabkan oleh lambatnya kalkulasi dasar. Latih refleks matematika dasar Anda di sini untuk mencetak waktu di bawah 1.5 detik per soal.
          </p>
        </div>

        <div class="setup-form-card glass-card">
          <!-- Operation Type Selection -->
          <div class="form-section">
            <label class="form-label">Fokus Operasi Aritmatika</label>
            <div class="segmented-control-custom">
              <button
                v-for="op in opOptions"
                :key="op.value"
                :class="['segmented-btn', operation === op.value ? 'active' : '']"
                @click="operation = op.value"
              >
                {{ op.label }}
              </button>
            </div>
          </div>

          <!-- Ranges Multipliers (Active for Perkalian, Pembagian, Campuran) -->
          <div v-if="['perkalian', 'pembagian', 'campuran'].includes(operation)" class="form-section">
            <label class="form-label">Angka yang Dilatih (Checkbox Multipliers)</label>
            <p class="section-desc">Pilih angka tabel perkalian/pembagian yang ingin diuji.</p>
            <div class="ranges-grid">
              <label v-for="num in 9" :key="num + 1" class="range-checkbox-label glass-card">
                <input
                  type="checkbox"
                  :value="num + 1"
                  v-model="selectedRanges"
                />
                <span class="checkbox-box"></span>
                <span class="checkbox-text">Angka {{ num + 1 }}</span>
              </label>
            </div>
          </div>

          <!-- Difficulty (Active for Penjumlahan, Pengurangan, Campuran) -->
          <div v-if="['penjumlahan', 'pengurangan', 'campuran'].includes(operation)" class="form-section">
            <label class="form-label">Tingkat Kesulitan Aritmatika</label>
            <div class="difficulty-options">
              <label
                v-for="diff in diffOptions"
                :key="diff.value"
                :class="['diff-radio-label', 'glass-card', difficulty === diff.value ? 'active' : '']"
                @click="difficulty = diff.value"
              >
                <span class="diff-title">{{ diff.label }}</span>
                <span class="diff-desc">{{ diff.desc }}</span>
              </label>
            </div>
          </div>

          <!-- Speed Limit / Time Limit per Question -->
          <div class="form-section">
            <label class="form-label">Batas Waktu Menjawab per Soal</label>
            <div class="timer-presets">
              <button
                v-for="t in timerPresets"
                :key="t.value"
                :class="['preset-btn', timeLimit === t.value ? 'active' : '']"
                @click="timeLimit = t.value"
              >
                <span class="material-icons" style="font-size: 16px;">schedule</span>
                {{ t.label }}
              </button>
            </div>
          </div>

          <!-- Total Questions Count -->
          <div class="form-section">
            <label class="form-label">Jumlah Soal</label>
            <div class="count-selector">
              <button
                v-for="c in countOptions"
                :key="c"
                :class="['count-btn', count === c ? 'active' : '']"
                @click="count = c"
              >
                {{ c }} Soal
              </button>
            </div>
          </div>

          <f7-button fill large class="gradient-bg-btn start-drill-btn" @click="startDrill">
            <span class="material-icons" style="margin-right: 8px;">play_circle</span>
            Mulai Drill Kecepatan
          </f7-button>
        </div>
      </div>

      <!-- 2. GAMEPLAY PLAY PHASE -->
      <div v-else-if="phase === 'play' && currentQuestion" class="play-container">
        <!-- Drill Progress & Header -->
        <div class="play-header-row">
          <span class="drill-progress">Soal {{ currentProgressIndex }} / {{ questions.length }}</span>
          <span v-if="timeLimit > 0" class="drill-question-timer" :class="{ critical: currentTimeLeft <= 1.5 }">
            <span class="material-icons" style="font-size: 16px;">schedule</span>
            {{ currentTimeLeft.toFixed(1) }}s
          </span>
          <span v-else class="drill-question-timer">
            Waktu Bebas
          </span>
        </div>

        <!-- Question Card -->
        <div class="question-flashcard glass-card">
          <div class="card-op-label">{{ getQuestionOpLabel(currentQuestion) }}</div>
          <div class="card-question-text">{{ currentQuestion.question }}</div>
          <div class="card-question-equals">=</div>
        </div>

        <!-- Choices Grid (Multiple Choice Distractors with UI Feedback) -->
        <div class="choices-grid-layout">
          <button
            v-for="(choice, idx) in currentQuestion.choices"
            :key="idx"
            :class="[
              'choice-btn-large',
              'glass-card',
              showFeedback && choice === currentQuestion.correctAnswer ? 'feedback-correct' : '',
              showFeedback && selectedChoice === choice && choice !== currentQuestion.correctAnswer ? 'feedback-incorrect' : '',
              showFeedback ? 'feedback-disabled' : ''
            ]"
            :disabled="showFeedback"
            @click="submitAnswer(choice)"
          >
            {{ choice }}
          </button>
        </div>
      </div>

      <!-- 3. RESULTS SUMMARY PHASE -->
      <div v-else-if="phase === 'result'" class="result-container">
        <!-- FLIPCARD REVIEW SECTION (Visible when in review mode) -->
        <div v-if="isReviewMode && incorrectQuestions.length > 0" class="flipcard-review-section glass-card" style="padding: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 12px;">
            <h3 style="margin: 0; font-size: 16px; font-weight: 800; color: #fff; display: flex; align-items: center; gap: 8px;">
              <span class="material-icons" style="color: var(--primary-color);">style</span>
              Review Kartu Balik ({{ reviewIndex + 1 }} / {{ incorrectQuestions.length }})
            </h3>
            <button @click="isReviewMode = false" style="background: transparent; border: none; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; padding: 4px;">
              <span class="material-icons">close</span>
            </button>
          </div>

          <!-- Flipcard component -->
          <div class="flipcard-container" @click="isCardFlipped = !isCardFlipped">
            <div :class="['flipcard-inner', isCardFlipped ? 'flipped' : '']">
              <!-- Front Side -->
              <div class="flipcard-front glass-card">
                <span class="flipcard-hint">Ketuk untuk melihat jawaban</span>
                <span class="flipcard-expr">{{ incorrectQuestions[reviewIndex].question }}</span>
                <span class="flipcard-equals">= ?</span>
              </div>
              <!-- Back Side -->
              <div class="flipcard-back glass-card">
                <span class="flipcard-hint">Ketuk untuk kembali ke soal</span>
                <span class="flipcard-expr">{{ incorrectQuestions[reviewIndex].question }}</span>
                <span class="flipcard-ans">{{ incorrectQuestions[reviewIndex].correctAnswer }}</span>
              </div>
            </div>
          </div>

          <!-- Flipcard actions -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 24px;">
            <f7-button outline large :disabled="reviewIndex === 0" @click="prevCard">
              <span class="material-icons" style="margin-right: 6px;">chevron_left</span>
              Sebelumnya
            </f7-button>
            <f7-button fill large :disabled="reviewIndex === incorrectQuestions.length - 1" @click="nextCard">
              Lanjut
              <span class="material-icons" style="margin-left: 6px;">chevron_right</span>
            </f7-button>
          </div>
          
          <f7-button outline large style="margin-top: 12px; border-color: rgba(255, 255, 255, 0.15) !important; color: #fff;" @click="isReviewMode = false">
            <span class="material-icons" style="margin-right: 6px;">check_circle</span>
            Selesai Review
          </f7-button>
        </div>

        <!-- STANDARD RESULTS SECTION (Visible when NOT in review mode) -->
        <div v-else class="results-standard-wrapper" style="display: flex; flex-direction: column; gap: 20px; width: 100%;">
          <!-- Results Score Header Card -->
          <div class="result-score-card glass-card">
            <div class="result-trophy-wrapper">
              <span class="material-icons trophy-icon" :style="{ color: score / count >= 0.9 ? 'var(--warning-color)' : '#94a3b8' }">
                {{ score / count >= 0.9 ? 'emoji_events' : 'verified' }}
              </span>
            </div>
            <h2 class="result-score-title">Hasil Latihan Refleks</h2>
            <div class="result-score-badge-row">
              <span class="score-badge">Akurasi: {{ Math.round((score / count) * 100) }}%</span>
              <span :class="['custom-badge', score / count >= 0.9 ? 'badge-success' : 'badge-error']">
                {{ score / count >= 0.9 ? 'MASTERY (LOLOS)' : 'BUTUH LATIHAN' }}
              </span>
            </div>

            <div class="result-stats-row">
              <div class="result-stat-col">
                <span class="stat-lbl">Benar</span>
                <span class="stat-val" style="color: var(--success-color);">{{ score }} / {{ count }}</span>
              </div>
              <div class="result-stat-col">
                <span class="stat-lbl">Rerata Latensi</span>
                <span class="stat-val" :style="{ color: averageLatencyMs <= 1500 ? 'var(--success-color)' : 'var(--error-color)' }">
                  {{ (averageLatencyMs / 1000).toFixed(2) }}s
                </span>
              </div>
            </div>
            <div class="latency-status-bar" :style="latencyBarColor">
              {{ latencyStatusText }}
            </div>
          </div>

          <!-- Flipcard Review Option Button -->
          <div v-if="incorrectQuestions.length > 0" class="glass-card" style="padding: 20px; text-align: center; border: 1px dashed rgba(99, 102, 241, 0.4);">
            <p style="margin: 0 0 14px 0; font-size: 13px; color: var(--text-secondary);">
              Anda memiliki {{ incorrectQuestions.length }} jawaban salah. Gunakan Kartu Balik (*Flipcards*) untuk melatih ingatan Anda.
            </p>
            <f7-button fill large style="background: linear-gradient(135deg, #a5b4fc 0%, #6366f1 100%) !important; box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);" @click="startReview">
              <span class="material-icons" style="margin-right: 8px;">style</span>
              Buka Review Kartu Balik
            </f7-button>
          </div>

          <!-- Detected Weak Spots -->
          <div v-if="weakSpotsList.length > 0" class="weak-spots-card glass-card">
            <h3 class="weak-spots-title">
              <span class="material-icons" style="color: var(--error-color); margin-right: 6px;">warning</span>
              Titik Lemah Terdeteksi (Butuh Perbaikan)
            </h3>
            <p class="weak-spots-desc">Daftar perhitungan matematika dasar yang salah dijawab atau membutuhkan respon terlalu lama (&gt; 2 detik).</p>
            <div class="weak-spots-list">
              <div v-for="(item, idx) in weakSpotsList" :key="idx" class="weak-spot-row">
                <span class="weak-spot-formula">{{ item.question }} = {{ item.correctAnswer }}</span>
                <span class="weak-spot-details">
                  <span class="weak-spot-badge error" v-if="!item.isCorrect">Salah Jawab</span>
                  <span class="weak-spot-badge warning" v-else>Respon Lambat ({{ ((item.latencyMs ?? 0) / 1000).toFixed(1) }}s)</span>
                </span>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="results-actions">
            <f7-button fill large class="gradient-bg-btn" @click="resetDrill">
              <span class="material-icons" style="margin-right: 8px;">refresh</span>
              Latih Lagi
            </f7-button>
            <f7-button outline large class="menu-btn-custom" @click="exitToDashboard">
              <span class="material-icons" style="margin-right: 8px;">dashboard</span>
              Kembali ke Dashboard
            </f7-button>
          </div>
        </div>
      </div>
    </div>
  </f7-page>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue';
import { state } from '../state';
import { f7 } from 'framework7-vue';
import { generateMathDrill, submitMathDrillHistory, type MathQuestion } from '../actions/mathDrillActions';

// Phase State
const phase = ref<'setup' | 'play' | 'result'>('setup');

// Setup form configuration
const operation = ref<'perkalian' | 'pembagian' | 'penjumlahan' | 'pengurangan' | 'campuran'>('perkalian');

const handleBeforeIn = () => {
  state.screen = 'math-drill';
  if (state.mathDrillPreset) {
    operation.value = state.mathDrillPreset.operation;
    selectedRanges.value = [...state.mathDrillPreset.selectedRanges];
    difficulty.value = state.mathDrillPreset.difficulty;
    count.value = state.mathDrillPreset.count;
    timeLimit.value = state.mathDrillPreset.timeLimit;
    
    if (state.mathDrillPreset.autoStart) {
      state.mathDrillPreset = null;
      startDrill();
    }
  }
};
const selectedRanges = ref<number[]>([2, 3, 4, 5, 6, 7, 8, 9, 10]);
const difficulty = ref<'easy' | 'medium' | 'hard'>('easy');
const count = ref<number>(20);
const timeLimit = ref<number>(0); // Time limit in seconds per question. 0 means infinite.

// Gameplay State
const questions = ref<MathQuestion[]>([]);
const currentIndex = ref<number>(0);
const score = ref<number>(0);
const totalDurationMs = ref<number>(0);
const answersHistory = ref<MathQuestion[]>([]);

// UI Feedback states during gameplay
const selectedChoice = ref<number | null>(null);
const showFeedback = ref<boolean>(false);

// Flipcard Review states
const isReviewMode = ref<boolean>(false);
const reviewIndex = ref<number>(0);
const isCardFlipped = ref<boolean>(false);

// Timer states for gameplay
const currentTimeLeft = ref<number>(0);
const currentStartTime = ref<number>(0);
let questionTimerInterval: any = null;

// Options static arrays
const opOptions = [
  { value: 'perkalian', label: '× Kali' },
  { value: 'pembagian', label: '÷ Bagi' },
  { value: 'penjumlahan', label: '+ Tambah' },
  { value: 'pengurangan', label: '− Kurang' },
  { value: 'campuran', label: '⚡ Campur' }
] as const;

const diffOptions = [
  { value: 'easy', label: 'Mudah', desc: '1-digit / Angka kecil (Hasil < 30)' },
  { value: 'medium', label: 'Sedang', desc: '2-digit / Angka menengah (10 s.d 90)' },
  { value: 'hard', label: 'Sulit', desc: '3-digit / Angka besar (Ratusan)' }
] as const;

const timerPresets = [
  { value: 0, label: 'Bebas' },
  { value: 5, label: '5 Detik' },
  { value: 3, label: '3 Detik' }
] as const;

const countOptions = [10, 20, 50] as const;

// Computed Properties
const currentQuestion = computed(() => {
  return questions.value[currentIndex.value];
});

const currentProgressIndex = computed(() => {
  return currentIndex.value + 1;
});

const averageLatencyMs = computed(() => {
  if (answersHistory.value.length === 0) return 0;
  const sum = answersHistory.value.reduce((acc, curr) => acc + (curr.latencyMs || 0), 0);
  return Math.round(sum / answersHistory.value.length);
});

const latencyStatusText = computed(() => {
  const avg = averageLatencyMs.value;
  if (avg <= 1500) {
    return 'Luar Biasa! Refleks Kalkulasi Sangat Cepat (<1.5s)';
  } else if (avg <= 2500) {
    return 'Cukup Baik, Targetkan Kecepatan <1.5 Detik per Soal';
  } else {
    return 'Perlu Latihan Intensif, Terlalu Lambat Untuk TIU Ujian CPNS';
  }
});

const latencyBarColor = computed(() => {
  const avg = averageLatencyMs.value;
  if (avg <= 1500) {
    return { background: 'rgba(74, 222, 128, 0.15)', color: 'var(--success-color)' };
  } else if (avg <= 2500) {
    return { background: 'rgba(250, 204, 21, 0.15)', color: 'var(--warning-color)' };
  } else {
    return { background: 'rgba(248, 113, 113, 0.15)', color: 'var(--error-color)' };
  }
});

/**
 * Filter questions that user got wrong OR answered too slowly (> 2.0 seconds)
 */
const weakSpotsList = computed(() => {
  return answersHistory.value.filter(q => {
    return !q.isCorrect || (q.latencyMs !== undefined && q.latencyMs > 2000);
  });
});

const incorrectQuestions = computed(() => {
  return answersHistory.value.filter(q => !q.isCorrect);
});

// Clean intervals on destroy
onBeforeUnmount(() => {
  clearInterval(questionTimerInterval);
});

// Game logic methods
const getQuestionOpLabel = (q: MathQuestion) => {
  if (q.question.includes('×')) return 'Perkalian';
  if (q.question.includes('÷')) return 'Pembagian';
  if (q.question.includes('+')) return 'Penjumlahan';
  if (q.question.includes('−')) return 'Pengurangan';
  return 'Aritmatika';
};

const startDrill = () => {
  // Validate selectedRanges for multiplication/division
  if (['perkalian', 'pembagian'].includes(operation.value) && selectedRanges.value.length === 0) {
    f7.dialog.alert('Silakan pilih minimal satu angka untuk dilatih.');
    return;
  }

  f7.preloader.show();
  try {
    // Generate questions
    const generated = generateMathDrill(
      operation.value,
      selectedRanges.value,
      difficulty.value,
      count.value
    );
    
    questions.value = generated;
    currentIndex.value = 0;
    score.value = 0;
    totalDurationMs.value = 0;
    answersHistory.value = [];
    isReviewMode.value = false;
    reviewIndex.value = 0;
    isCardFlipped.value = false;
    phase.value = 'play';
    startQuestionTimer();
  } finally {
    f7.preloader.hide();
  }
};

const startQuestionTimer = () => {
  clearInterval(questionTimerInterval);
  currentStartTime.value = Date.now();
  
  if (timeLimit.value > 0) {
    currentTimeLeft.value = timeLimit.value;
    questionTimerInterval = setInterval(() => {
      currentTimeLeft.value -= 0.1;
      if (currentTimeLeft.value <= 0) {
        clearInterval(questionTimerInterval);
        submitAnswer(-1); // Automatically submit wrong answer on timeout
      }
    }, 100);
  }
};

const submitAnswer = (choice: number) => {
  if (showFeedback.value) return; // Prevent double clicks during feedback transition

  clearInterval(questionTimerInterval);
  const latency = Date.now() - currentStartTime.value;
  totalDurationMs.value += latency;
  
  const questionObj = currentQuestion.value;
  questionObj.userAnswer = choice;
  questionObj.latencyMs = latency;
  questionObj.isCorrect = choice === questionObj.correctAnswer;
  
  // Record answer history
  answersHistory.value.push(questionObj);

  if (questionObj.isCorrect) {
    score.value++;
  }

  // Trigger feedback
  selectedChoice.value = choice;
  showFeedback.value = true;

  setTimeout(() => {
    // Reset feedback states
    showFeedback.value = false;
    selectedChoice.value = null;

    // Go to next question, or finish
    if (currentIndex.value < questions.value.length - 1) {
      currentIndex.value++;
      startQuestionTimer();
    } else {
      finishDrill();
    }
  }, 1000); // 1.0 second delay for feedback display
};

const startReview = () => {
  reviewIndex.value = 0;
  isCardFlipped.value = false;
  isReviewMode.value = true;
};

const prevCard = () => {
  if (reviewIndex.value > 0) {
    isCardFlipped.value = false;
    setTimeout(() => {
      reviewIndex.value--;
    }, 150);
  }
};

const nextCard = () => {
  if (reviewIndex.value < incorrectQuestions.value.length - 1) {
    isCardFlipped.value = false;
    setTimeout(() => {
      reviewIndex.value++;
    }, 150);
  }
};

const finishDrill = async () => {
  phase.value = 'result';
  const finalDurationSec = Math.round(totalDurationMs.value / 1000);
  
  // Compile weak spots lists in breakdown metadata
  const weakSpotFormulas = weakSpotsList.value.map(item => item.question);

  f7.preloader.show();
  try {
    let opLabel = 'Perkalian';
    if (operation.value === 'pembagian') opLabel = 'Pembagian';
    else if (operation.value === 'penjumlahan') opLabel = 'Penjumlahan';
    else if (operation.value === 'pengurangan') opLabel = 'Pengurangan';
    else if (operation.value === 'campuran') opLabel = 'Campuran';

    await submitMathDrillHistory(
      `Latihan Refleks: ${opLabel}`,
      score.value,
      count.value,
      finalDurationSec,
      {
        type: 'math_drill',
        operation: operation.value,
        selected_ranges: selectedRanges.value,
        avg_latency_ms: averageLatencyMs.value,
        weak_spots: weakSpotFormulas
      }
    );
  } catch (err) {
    console.error('Error saving math drill history:', err);
  } finally {
    f7.preloader.hide();
  }
};

const resetDrill = () => {
  phase.value = 'setup';
};

const exitToDashboard = () => {
  if (f7.views.main && f7.views.main.router) {
    f7.views.main.router.navigate('/');
  }
};
</script>

