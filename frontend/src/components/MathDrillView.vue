<template>
  <f7-page name="math-drill" class="math-drill-page" @page:beforein="state.screen = 'math-drill'">
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

        <!-- Choices Grid (Multiple Choice Distractors) -->
        <div class="choices-grid-layout">
          <button
            v-for="(choice, idx) in currentQuestion.choices"
            :key="idx"
            class="choice-btn-large glass-card"
            @click="submitAnswer(choice)"
          >
            {{ choice }}
          </button>
        </div>
      </div>

      <!-- 3. RESULTS SUMMARY PHASE -->
      <div v-else-if="phase === 'result'" class="result-container">
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
                <span class="weak-spot-badge warning" v-else>Respon Lambat ({{ (item.latencyMs / 1000).toFixed(1) }}s)</span>
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
const adaptiveQueue = ref<MathQuestion[]>([]); // Spaced repetition queue for missed questions

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
    adaptiveQueue.value = [];
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
  } else {
    // Spaced Repetition adaptive learning: queue wrong questions to repeat at the end!
    adaptiveQueue.value.push({
      id: questions.value.length + adaptiveQueue.value.length + 1,
      question: questionObj.question,
      correctAnswer: questionObj.correctAnswer,
      choices: questionObj.choices
    });
  }

  // Go to next question, or process adaptive repetition queue, or finish
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value++;
    startQuestionTimer();
  } else if (adaptiveQueue.value.length > 0) {
    // Append the adaptive queue to questions list, notify user
    const addedCount = adaptiveQueue.value.length;
    f7.toast.create({
      text: `${addedCount} soal yang salah dimasukkan kembali ke antrean untuk dilatih ulang!`,
      closeButton: true,
      destroyOnClose: true,
      position: 'top',
      cssClass: 'toast-warning'
    }).open();

    // Concat queue and clear it
    questions.value = [...questions.value, ...adaptiveQueue.value];
    adaptiveQueue.value = [];
    currentIndex.value++;
    startQuestionTimer();
  } else {
    finishDrill();
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

<style scoped>
.logo-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.setup-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 16px;
  animation: fadeIn 0.4s ease-out;
}

.setup-header {
  padding: 24px;
  text-align: center;
}

.setup-header-icon {
  font-size: 48px;
  color: var(--primary-color);
  margin-bottom: 12px;
  text-shadow: 0 0 16px var(--primary-glow);
}

.setup-title {
  font-size: 22px;
  font-weight: 800;
  margin: 0 0 8px 0;
  color: #fff;
}

.setup-desc {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.5;
  margin: 0;
}

.setup-form-card {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 800;
  color: #fff;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.section-desc {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0;
}

/* Custom segmented control */
.segmented-control-custom {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 4px;
  gap: 4px;
}

@media (max-width: 576px) {
  .segmented-control-custom {
    grid-template-columns: repeat(3, 1fr);
  }
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

/* Ranges Grid */
.ranges-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 6px;
}

@media (max-width: 480px) {
  .ranges-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.range-checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  cursor: pointer;
  position: relative;
  user-select: none;
  transition: var(--transition-smooth);
}

.range-checkbox-label input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkbox-box {
  width: 18px;
  height: 18px;
  background: rgba(255, 255, 255, 0.05);
  border: 1.5px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  display: inline-block;
  position: relative;
  transition: var(--transition-smooth);
}

.range-checkbox-label:hover {
  border-color: rgba(255, 255, 255, 0.15);
}

.range-checkbox-label input:checked ~ .checkbox-box {
  background: var(--primary-color);
  border-color: var(--primary-color);
  box-shadow: 0 0 8px var(--primary-glow);
}

.range-checkbox-label input:checked ~ .checkbox-box::after {
  content: "";
  position: absolute;
  left: 5px;
  top: 2px;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.checkbox-text {
  font-size: 13px;
  font-weight: 600;
  color: #fff;
}

/* Difficulty Option Cards */
.difficulty-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.diff-radio-label {
  display: flex;
  flex-direction: column;
  padding: 14px 18px;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: var(--transition-smooth);
}

.diff-radio-label.active {
  border-color: var(--primary-color);
  background: rgba(99, 102, 241, 0.08) !important;
  box-shadow: 0 0 16px rgba(99, 102, 241, 0.15);
}

.diff-title {
  font-size: 14px;
  font-weight: 800;
  color: #fff;
}

.diff-desc {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 4px;
}

/* Timer presets */
.timer-presets {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.preset-btn {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  color: #fff;
  padding: 12px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: var(--transition-smooth);
}

.preset-btn:hover {
  background: rgba(255, 255, 255, 0.08);
}

.preset-btn.active {
  background: rgba(234, 88, 12, 0.15);
  border-color: #ea580c;
  color: #ff7a30;
  box-shadow: 0 0 12px rgba(234, 88, 12, 0.2);
}

/* count-selector */
.count-selector {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.count-btn {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  color: #fff;
  padding: 12px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.count-btn.active {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
}

.start-drill-btn {
  margin-top: 10px;
}

/* 2. GAMEPLAY UI */
.play-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 16px;
  animation: fadeIn 0.4s ease-out;
}

.play-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4px;
}

.drill-progress {
  font-size: 15px;
  font-weight: 800;
  color: #fff;
  letter-spacing: 0.05em;
}

.drill-question-timer {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 800;
  color: #fff;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: monospace;
}

.drill-question-timer.critical {
  background: rgba(239, 68, 68, 0.15);
  border-color: #ef4444;
  color: #f87171;
  animation: pulse-red 1s infinite alternate;
}

.question-flashcard {
  padding: 50px 30px;
  text-align: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);
  border-width: 1.5px !important;
}

.question-flashcard::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary-color), #f43f5e);
}

.card-op-label {
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--text-muted);
  margin-bottom: 24px;
}

.card-question-text {
  font-size: 54px;
  font-weight: 900;
  color: #fff;
  letter-spacing: 0.02em;
  margin-bottom: 12px;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 0 16px rgba(255, 255, 255, 0.1);
}

.card-question-equals {
  font-size: 28px;
  font-weight: 800;
  color: var(--text-muted);
}

.choices-grid-layout {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 10px;
}

.choice-btn-large {
  padding: 26px 20px;
  font-size: 28px;
  font-weight: 900;
  color: #fff;
  background: rgba(18, 24, 38, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-variant-numeric: tabular-nums;
}

.choice-btn-large:hover {
  transform: translateY(-2px);
  border-color: var(--primary-color);
  box-shadow: 0 8px 20px var(--primary-glow);
}

.choice-btn-large:active {
  transform: scale(0.97);
}

/* 3. RESULTS SUMMARY UI */
.result-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 16px;
  animation: fadeIn 0.4s ease-out;
}

.result-score-card {
  padding: 30px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.result-trophy-wrapper {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.trophy-icon {
  font-size: 40px;
  text-shadow: 0 0 16px rgba(250, 204, 21, 0.3);
}

.result-score-title {
  font-size: 20px;
  font-weight: 800;
  color: #fff;
  margin: 0 0 10px 0;
}

.result-score-badge-row {
  display: flex;
  gap: 10px;
  margin-bottom: 24px;
  align-items: center;
}

.score-badge {
  background: rgba(255, 255, 255, 0.05);
  border: 1.5px solid rgba(255, 255, 255, 0.1);
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 800;
  color: #fff;
}

.result-stats-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  width: 100%;
  border-top: 1px dashed rgba(255, 255, 255, 0.08);
  padding-top: 20px;
  margin-bottom: 16px;
}

.result-stat-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-lbl {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
}

.stat-val {
  font-size: 24px;
  font-weight: 900;
  color: #fff;
  font-variant-numeric: tabular-nums;
}

.latency-status-bar {
  width: 100%;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
  box-sizing: border-box;
}

.weak-spots-card {
  padding: 20px;
}

.weak-spots-title {
  font-size: 15px;
  font-weight: 800;
  color: #fff;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
}

.weak-spots-desc {
  font-size: 11.5px;
  color: var(--text-muted);
  line-height: 1.4;
  margin: 0 0 16px 0;
}

.weak-spots-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.weak-spot-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 8px;
}

.weak-spot-formula {
  font-size: 15px;
  font-weight: 800;
  color: #fff;
  font-family: monospace;
}

.weak-spot-badge {
  font-size: 10px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
}

.weak-spot-badge.error {
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.weak-spot-badge.warning {
  background: rgba(234, 88, 12, 0.1);
  color: #ff8e46;
  border: 1px solid rgba(234, 88, 12, 0.2);
}

.results-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.menu-btn-custom {
  color: #fff !important;
  border-color: rgba(255, 255, 255, 0.15) !important;
}

.menu-btn-custom:hover {
  background: rgba(255, 255, 255, 0.03);
}

/* Animations & transitions */
@keyframes pulse-red {
  from {
    box-shadow: 0 0 4px rgba(239, 68, 68, 0.2);
  }
  to {
    box-shadow: 0 0 12px rgba(239, 68, 68, 0.4);
  }
}
</style>
