// app.js — Core Interactive Logic for AksaraCPNS PWA

// Global State
let allQuestions = [];
let currentCategory = ''; // 'TWK', 'TIU', 'TKP', 'SIMULASI'
let currentMode = '';     // 'latihan', 'simulasi'
let currentQuestions = [];
let currentIndex = 0;
let userAnswers = {};     // { questionIndex: selectedOption }
let userFlags = new Set(); // Set of flagged indices
let examTimer = null;
let timeLeft = 0;         // in seconds
let stats = {
  completed: 0,
  avgScore: 0,
  history: []
};

// Passing Grades (Nilai Ambang Batas CPNS)
const PASSING_GRADES = {
  TWK: 65,
  TIU: 80,
  TKP: 166,
  TOTAL: 311
};

// Max Scores per Category
const MAX_SCORES = {
  TWK: 150, // 30 questions * 5
  TIU: 175, // 35 questions * 5
  TKP: 225, // 45 questions * 5
  TOTAL: 550
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  loadStats();
  loadQuestionsData();
  setupModalEvents();
  
  // Register Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js')
        .then(reg => console.log('Service Worker registered!'))
        .catch(err => console.log('Service Worker registration failed:', err));
    });
  }

  // Monitor network status
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();
});

// Update online/offline indicator
function updateOnlineStatus() {
  const offlineInd = document.getElementById('offline-indicator');
  if (navigator.onLine) {
    offlineInd.classList.add('hidden');
  } else {
    offlineInd.classList.remove('hidden');
  }
}

// Load stats from LocalStorage
function loadStats() {
  const saved = localStorage.getItem('cpns_pwa_stats');
  if (saved) {
    stats = JSON.parse(saved);
    updateDashboardStats();
  }
}

// Save stats to LocalStorage
function saveStats() {
  localStorage.setItem('cpns_pwa_stats', JSON.stringify(stats));
  updateDashboardStats();
}

// Update Stats UI on Dashboard
function updateDashboardStats() {
  document.getElementById('stats-completed').innerText = stats.completed;
  document.getElementById('stats-avg-score').innerText = Math.round(stats.avgScore) + '%';
  
  // Update history list if elements exist
  const historyArea = document.getElementById('history-section-area');
  const historyContainer = document.getElementById('history-list-container');
  
  if (stats.history && stats.history.length > 0) {
    historyArea.classList.remove('hidden');
    historyContainer.innerHTML = '';
    
    // Show last 5 records
    stats.history.slice().reverse().slice(0, 5).forEach(item => {
      const row = document.createElement('div');
      row.className = 'history-item';
      
      const date = new Date(item.date).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
      });
      
      const isPass = item.isPass ? 'LULUS' : 'TIDAK LULUS';
      const statusClass = item.isPass ? 'pass' : 'fail';
      
      row.innerHTML = `
        <div class="history-meta">
          <span class="history-name">${item.name}</span>
          <span class="history-date">${date}</span>
        </div>
        <div class="history-score">
          <span class="history-points">Skor: ${item.score}/${item.maxScore} (${Math.round(item.percent)}%)</span>
          <span class="history-status ${statusClass}">${isPass}</span>
        </div>
      `;
      historyContainer.appendChild(row);
    });
  } else {
    historyArea.classList.add('hidden');
  }
}

// Fetch bank_soal_cpns.json
async function loadQuestionsData() {
  try {
    const response = await fetch('bank_soal_cpns.json');
    if (!response.ok) throw new Error('Failed to load database');
    allQuestions = await response.json();
    
    // Update question counts in cards
    const counts = { TWK: 0, TIU: 0, TKP: 0 };
    allQuestions.forEach(q => {
      const cat = q.category.toUpperCase();
      if (counts[cat] !== undefined) counts[cat]++;
    });
    
    document.getElementById('count-twk').innerText = `${counts.TWK} Soal`;
    document.getElementById('count-tiu').innerText = `${counts.TIU} Soal`;
    document.getElementById('count-tkp').innerText = `${counts.TKP} Soal`;
    document.getElementById('stats-total-soal').innerText = allQuestions.length;
    
  } catch (error) {
    console.error('Error loading questions:', error);
    // Fallback if fetch fails (e.g. initial launch before parsing)
    document.getElementById('stats-total-soal').innerText = '0';
  }
}

// Screen Routing
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
  
  // Scroll to top of window
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  // Header Logo Visibility
  const headerLogo = document.getElementById('header-logo');
  const headerStatus = document.getElementById('header-status-area');
  
  if (screenId === 'screen-practice') {
    headerLogo.classList.add('hidden');
    headerStatus.classList.remove('hidden');
  } else {
    headerLogo.classList.remove('hidden');
    headerStatus.classList.add('hidden');
    
    // Clear exam timer if exiting exam screen
    if (examTimer) {
      clearInterval(examTimer);
      examTimer = null;
    }
  }
}

// Handle Packet Selection
function selectCategory(category, mode) {
  currentCategory = category;
  currentMode = mode;
  
  // Filter questions for this category
  const categoryQuestions = allQuestions.filter(q => q.category.toUpperCase() === category);
  
  if (categoryQuestions.length === 0) {
    alert('Soal untuk kategori ini belum tersedia. Silakan jalankan parser data.');
    return;
  }
  
  // Generate packets: 10 questions per packet
  const packetSize = 10;
  const numPackets = Math.ceil(categoryQuestions.length / packetSize);
  
  const container = document.getElementById('packet-list-container');
  container.innerHTML = '';
  
  document.getElementById('packet-screen-title').innerText = `${category} - Latihan Soal`;
  document.getElementById('packet-screen-subtitle').innerText = `Pilih paket latihan untuk mengasah kemampuan Anda.`;
  
  for (let i = 0; i < numPackets; i++) {
    const startIdx = i * packetSize;
    const endIdx = Math.min(startIdx + packetSize, categoryQuestions.length);
    const packetQuestions = categoryQuestions.slice(startIdx, endIdx);
    
    const card = document.createElement('div');
    card.className = 'packet-card';
    card.onclick = () => startPracticeSession(packetQuestions, `${category} - Paket ${i + 1}`);
    
    card.innerHTML = `
      <h3 class="packet-title">Paket ${i + 1}</h3>
      <div class="packet-details">
        <span class="packet-pill">${packetQuestions.length} Soal</span>
        <span class="packet-pill">${packetQuestions.length * 1} Menit</span>
      </div>
      <button class="btn btn-secondary btn-sm" style="width:100%; margin-top:auto;">Mulai</button>
    `;
    container.appendChild(card);
  }
  
  showScreen('screen-packets');
}

// Start Practice Session
function startPracticeSession(questionsList, sessionName) {
  currentQuestions = questionsList;
  currentIndex = 0;
  userAnswers = {};
  userFlags.clear();
  currentMode = 'latihan';
  
  // Set up Timer: 1 minute per question
  timeLeft = questionsList.length * 60;
  updateTimerDisplay();
  startTimer();
  
  // Set up Header Status
  document.getElementById('exam-session-name').innerText = sessionName;
  document.getElementById('exam-category-badge').innerText = currentCategory;
  document.getElementById('exam-category-badge').className = `exam-badge ${currentCategory.toLowerCase()}-icon`;
  
  // Show navigation sidebar
  renderAnswerSheet();
  
  // Load first question
  loadQuestion(0);
  
  // Hide Submit button initially
  document.getElementById('btn-submit-exam').classList.add('hidden');
  document.getElementById('btn-next-question').classList.remove('hidden');
  
  showScreen('screen-practice');
}

// Start Full Simulation (110 Soal)
function startFullSimulation() {
  const twkSoals = allQuestions.filter(q => q.category.toUpperCase() === 'TWK');
  const tiuSoals = allQuestions.filter(q => q.category.toUpperCase() === 'TIU');
  const tkpSoals = allQuestions.filter(q => q.category.toUpperCase() === 'TKP');
  
  if (twkSoals.length < 30 || tiuSoals.length < 35 || tkpSoals.length < 45) {
    alert('Bank soal belum lengkap untuk simulasi CAT penuh (butuh minimal 30 TWK, 35 TIU, 45 TKP). Silakan selesaikan capture terlebih dahulu.');
    return;
  }
  
  // Randomly select required questions
  const selectedTWK = getRandomElements(twkSoals, 30);
  const selectedTIU = getRandomElements(tiuSoals, 35);
  const selectedTKP = getRandomElements(tkpSoals, 45);
  
  currentQuestions = [...selectedTWK, ...selectedTIU, ...selectedTKP];
  currentIndex = 0;
  userAnswers = {};
  userFlags.clear();
  currentCategory = 'SIMULASI';
  currentMode = 'simulasi';
  
  // Set up Timer: 100 minutes (6000 seconds)
  timeLeft = 100 * 60;
  updateTimerDisplay();
  startTimer();
  
  // Set up UI
  document.getElementById('exam-session-name').innerText = 'Simulasi CAT CPNS';
  document.getElementById('exam-category-badge').innerText = 'CAT';
  document.getElementById('exam-category-badge').className = 'exam-badge';
  
  renderAnswerSheet();
  loadQuestion(0);
  
  showScreen('screen-practice');
}

// Timer Functions
function startTimer() {
  if (examTimer) clearInterval(examTimer);
  
  examTimer = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    
    if (timeLeft <= 0) {
      clearInterval(examTimer);
      alert('Waktu ujian telah habis!');
      submitExam();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timerStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  
  document.getElementById('exam-timer').innerText = timerStr;
  document.getElementById('exam-progress').innerText = `${currentIndex + 1} / ${currentQuestions.length}`;
}

// Helper to select random elements
function getRandomElements(arr, n) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

// Load Question
function loadQuestion(index) {
  currentIndex = index;
  updateTimerDisplay();
  
  const q = currentQuestions[index];
  
  // Set Question Text
  document.getElementById('question-number-display').innerText = `Soal No. ${index + 1} (${q.category.toUpperCase()})`;
  document.getElementById('question-text').innerText = q.soal;
  
  // Handle Question Image
  const imgBox = document.getElementById('question-image-box');
  const imgEl = document.getElementById('question-image');
  if (q.img_soal) {
    imgEl.src = q.img_soal;
    imgBox.classList.remove('hidden');
  } else {
    imgBox.classList.add('hidden');
  }
  
  // Set up Options (A-E)
  const optionsBox = document.getElementById('options-box');
  optionsBox.innerHTML = '';
  
  const choices = ['A', 'B', 'C', 'D', 'E'];
  choices.forEach(ch => {
    const text = q[ch.toLowerCase()];
    if (!text) return; // skip if option is empty (though mostly A-E are filled)
    
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    if (userAnswers[index] === ch) {
      btn.classList.add('selected');
    }
    
    // If in Latihan mode AND user has answered, show correct/wrong feedback immediately
    if (currentMode === 'latihan' && userAnswers[index]) {
      btn.disabled = true;
      if (ch === q.kunci.toUpperCase()) {
        btn.classList.add('correct');
      } else if (userAnswers[index] === ch) {
        btn.classList.add('wrong');
      }
    }
    
    btn.onclick = () => selectOption(ch);
    
    btn.innerHTML = `
      <span class="option-letter">${ch}</span>
      <span class="option-text">${text}</span>
    `;
    optionsBox.appendChild(btn);
  });
  
  // Show explanation if in Latihan mode and answered
  const expBox = document.getElementById('explanation-box');
  if (currentMode === 'latihan' && userAnswers[index]) {
    document.getElementById('explanation-text').innerText = q.pembahasan || 'Tidak ada pembahasan tertulis.';
    expBox.classList.remove('hidden');
  } else {
    expBox.classList.add('hidden');
  }
  
  // Manage Next/Submit buttons visibility
  const btnNext = document.getElementById('btn-next-question');
  const btnSubmit = document.getElementById('btn-submit-exam');
  
  if (index === currentQuestions.length - 1) {
    btnNext.classList.add('hidden');
    btnSubmit.classList.remove('hidden');
  } else {
    btnNext.classList.remove('hidden');
    btnSubmit.classList.add('hidden');
  }
  
  // Flag indicator
  const flagInd = document.getElementById('flag-indicator');
  const flagBtnText = document.getElementById('flag-btn-text');
  if (userFlags.has(index)) {
    flagInd.classList.remove('hidden');
    flagBtnText.innerText = 'Batal Ragu';
  } else {
    flagInd.classList.add('hidden');
    flagBtnText.innerText = 'Ragu-Ragu';
  }
  
  // Active state in sidebar
  document.querySelectorAll('.grid-node').forEach(node => node.classList.remove('active'));
  const activeNode = document.getElementById(`grid-node-${index}`);
  if (activeNode) activeNode.classList.add('active');
}

// Answer Selection
function selectOption(option) {
  // Save answer
  userAnswers[currentIndex] = option;
  
  // Update sidebar grid item
  const node = document.getElementById(`grid-node-${currentIndex}`);
  if (node) {
    node.classList.remove('flagged');
    node.classList.add('answered');
  }
  
  // Refresh current question to trigger feedback if in Latihan mode
  loadQuestion(currentIndex);
}

// Flag Question
function toggleFlagQuestion() {
  const node = document.getElementById(`grid-node-${currentIndex}`);
  
  if (userFlags.has(currentIndex)) {
    userFlags.delete(currentIndex);
    if (userAnswers[currentIndex]) {
      node.classList.remove('flagged');
      node.classList.add('answered');
    } else {
      node.classList.remove('flagged');
    }
  } else {
    userFlags.add(currentIndex);
    node.classList.remove('answered');
    node.classList.add('flagged');
  }
  
  loadQuestion(currentIndex);
}

// Navigation
function prevQuestion() {
  if (currentIndex > 0) {
    loadQuestion(currentIndex - 1);
  }
}

function nextQuestion() {
  if (currentIndex < currentQuestions.length - 1) {
    loadQuestion(currentIndex + 1);
  }
}

// Toggle Sidebar for mobile
function toggleExamGrid() {
  const sidebar = document.getElementById('exam-sidebar');
  sidebar.classList.toggle('active-sidebar');
}

// Render Answer Grid Sidebar
function renderAnswerSheet() {
  const grid = document.getElementById('answer-sheet-grid');
  grid.innerHTML = '';
  
  currentQuestions.forEach((_, index) => {
    const node = document.createElement('div');
    node.className = 'grid-node';
    node.id = `grid-node-${index}`;
    node.innerText = index + 1;
    node.onclick = () => {
      loadQuestion(index);
      // Close sidebar on mobile
      document.getElementById('exam-sidebar').classList.remove('active-sidebar');
    };
    grid.appendChild(node);
  });
}

// Custom Modal Dialogs
function setupModalEvents() {
  const modal = document.getElementById('custom-modal');
  const cancelBtn = document.getElementById('modal-btn-cancel');
  
  cancelBtn.onclick = () => {
    modal.classList.add('hidden');
  };
}

function showModal(title, desc, confirmCallback) {
  const modal = document.getElementById('custom-modal');
  document.getElementById('modal-title').innerText = title;
  document.getElementById('modal-desc').innerText = desc;
  
  const confirmBtn = document.getElementById('modal-btn-confirm');
  confirmBtn.onclick = () => {
    modal.classList.add('hidden');
    confirmCallback();
  };
  
  modal.classList.remove('hidden');
}

// Exit Exam Confirmation
function confirmExitExam() {
  showModal(
    'Keluar Ujian?',
    'Apakah Anda yakin ingin membatalkan ujian ini? Semua jawaban yang Anda masukkan pada sesi ini akan hilang.',
    () => {
      showScreen('screen-dashboard');
    }
  );
}

// Submit Exam Confirmation
function confirmSubmitExam() {
  const totalQuestionsCount = currentQuestions.length;
  const answeredCount = Object.keys(userAnswers).length;
  const unansweredCount = totalQuestionsCount - answeredCount;
  
  let desc = `Anda telah menjawab ${answeredCount} dari ${totalQuestionsCount} soal.`;
  if (unansweredCount > 0) {
    desc += ` Masih ada ${unansweredCount} soal yang belum terjawab.`;
  }
  desc += ' Apakah Anda yakin ingin menyelesaikan ujian sekarang?';
  
  showModal('Selesaikan Ujian?', desc, submitExam);
}

// Submit and Score Exam
function submitExam() {
  if (examTimer) {
    clearInterval(examTimer);
    examTimer = null;
  }
  
  // Calculate Scores
  let scoreTWK = 0;
  let scoreTIU = 0;
  let scoreTKP = 0;
  
  let countTWK = 0;
  let countTIU = 0;
  let countTKP = 0;
  
  currentQuestions.forEach((q, idx) => {
    const selected = userAnswers[idx];
    const cat = q.category.toUpperCase();
    
    if (cat === 'TWK') {
      countTWK++;
      if (selected && selected.toUpperCase() === q.kunci.toUpperCase()) {
        scoreTWK += 5;
      }
    } else if (cat === 'TIU') {
      countTIU++;
      if (selected && selected.toUpperCase() === q.kunci.toUpperCase()) {
        scoreTIU += 5;
      }
    } else if (cat === 'TKP') {
      countTKP++;
      if (selected) {
        const optionScore = parseInt(q[`skor_${selected.toLowerCase()}`] || 0);
        scoreTKP += optionScore;
      }
    }
  });
  
  const totalScore = scoreTWK + scoreTIU + scoreTKP;
  const totalMaxScore = (countTWK * 5) + (countTIU * 5) + (countTKP * 5);
  const percentScore = (totalScore / totalMaxScore) * 100;
  
  // Check Passing Grade (Different criteria if Latihan vs Full Simulation)
  let isPass = false;
  if (currentMode === 'simulasi') {
    isPass = (scoreTWK >= PASSING_GRADES.TWK) && 
             (scoreTIU >= PASSING_GRADES.TIU) && 
             (scoreTKP >= PASSING_GRADES.TKP);
  } else {
    // Single category practice: pass if percentage >= 70%
    isPass = percentScore >= 70;
  }
  
  // Update Verdict
  const verdictStatus = document.getElementById('result-status-verdict');
  const verdictDesc = document.getElementById('result-verdict-description');
  
  if (isPass) {
    verdictStatus.innerText = 'LULUS';
    verdictStatus.className = 'verdict-status pass';
    verdictDesc.innerText = 'Selamat! Nilai Anda memenuhi nilai ambang batas (Passing Grade) yang ditentukan.';
  } else {
    verdictStatus.innerText = 'TIDAK LULUS';
    verdictStatus.className = 'verdict-status fail';
    
    if (currentMode === 'simulasi') {
      let failedCats = [];
      if (scoreTWK < PASSING_GRADES.TWK) failedCats.push(`TWK (< ${PASSING_GRADES.TWK})`);
      if (scoreTIU < PASSING_GRADES.TIU) failedCats.push(`TIU (< ${PASSING_GRADES.TIU})`);
      if (scoreTKP < PASSING_GRADES.TKP) failedCats.push(`TKP (< ${PASSING_GRADES.TKP})`);
      verdictDesc.innerText = `Maaf, Anda tidak lolos ambang batas pada kategori: ${failedCats.join(', ')}. Teruslah belajar dan mencoba!`;
    } else {
      verdictDesc.innerText = 'Maaf, nilai Anda belum memenuhi standar kelulusan latihan (minimal 70%). Coba lagi untuk hasil lebih baik!';
    }
  }
  
  // Update Score Displays
  document.getElementById('result-score-percent').innerText = `${Math.round(percentScore)}%`;
  document.getElementById('result-score-raw').innerText = `Skor: ${totalScore} / ${totalMaxScore}`;
  
  // Animate Gauge Progress
  const circle = document.getElementById('result-score-circle');
  const radius = circle.r.baseVal.value;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentScore / 100) * circumference;
  circle.style.strokeDashoffset = offset;
  circle.style.stroke = isPass ? '#10b981' : '#ef4444';
  
  // Render category breakdown table
  const tableBody = document.getElementById('result-table-body');
  tableBody.innerHTML = '';
  
  const categoryBreakdown = [];
  if (countTWK > 0) categoryBreakdown.push({ name: 'TWK', score: scoreTWK, max: countTWK * 5, pg: currentMode === 'simulasi' ? PASSING_GRADES.TWK : '-' });
  if (countTIU > 0) categoryBreakdown.push({ name: 'TIU', score: scoreTIU, max: countTIU * 5, pg: currentMode === 'simulasi' ? PASSING_GRADES.TIU : '-' });
  if (countTKP > 0) categoryBreakdown.push({ name: 'TKP', score: scoreTKP, max: countTKP * 5, pg: currentMode === 'simulasi' ? PASSING_GRADES.TKP : '-' });
  
  categoryBreakdown.forEach(cat => {
    const row = document.createElement('tr');
    
    let catPass = 'PASS';
    let catPassClass = 'pass';
    if (currentMode === 'simulasi') {
      const isCatPass = cat.score >= cat.pg;
      catPass = isCatPass ? 'LULUS' : 'TIDAK LULUS';
      catPassClass = isCatPass ? 'pass' : 'fail';
    } else {
      const isCatPass = (cat.score / cat.max) >= 0.7;
      catPass = isCatPass ? 'LULUS' : 'TIDAK LULUS';
      catPassClass = isCatPass ? 'pass' : 'fail';
    }
    
    row.innerHTML = `
      <td><strong>${cat.name}</strong></td>
      <td>${cat.score} / ${cat.max}</td>
      <td>${cat.pg}</td>
      <td><span class="table-status ${catPassClass}">${catPass}</span></td>
    `;
    tableBody.appendChild(row);
  });
  
  // Save record to stats history
  const historyRecord = {
    date: new Date().toISOString(),
    name: currentMode === 'simulasi' ? 'Simulasi CAT Lengkap' : `${currentCategory} - Latihan`,
    score: totalScore,
    maxScore: totalMaxScore,
    percent: percentScore,
    isPass: isPass
  };
  
  stats.completed++;
  stats.history.push(historyRecord);
  
  // Calculate new average score
  const totalPercentSum = stats.history.reduce((sum, item) => sum + item.percent, 0);
  stats.avgScore = totalPercentSum / stats.history.length;
  
  saveStats();
  
  // Show results screen
  showScreen('screen-result');
}

// Review Answers mode
function startReviewAnswers() {
  currentMode = 'review';
  currentIndex = 0;
  
  // Set up Header Status
  document.getElementById('exam-session-name').innerText = 'Review Jawaban';
  document.getElementById('exam-grid-toggle').classList.remove('hidden');
  
  // Render Grid Sidebar
  renderAnswerSheet();
  
  // Apply visual style on grid nodes for review mode
  currentQuestions.forEach((q, idx) => {
    const node = document.getElementById(`grid-node-${idx}`);
    if (!node) return;
    
    const selected = userAnswers[idx];
    const isTWK_TIU = q.category.toUpperCase() !== 'TKP';
    
    if (isTWK_TIU) {
      if (selected === q.kunci.toUpperCase()) {
        node.style.background = '#10b981'; // Green for correct
        node.style.color = 'white';
      } else if (selected) {
        node.style.background = '#ef4444'; // Red for incorrect
        node.style.color = 'white';
      } else {
        node.style.background = '#374151'; // Unanswered
      }
    } else {
      // TKP has grades, colour green if score > 3, else red/grey
      const score = selected ? parseInt(q[`skor_${selected.toLowerCase()}`] || 0) : 0;
      if (score >= 4) {
        node.style.background = '#10b981';
        node.style.color = 'white';
      } else if (selected) {
        node.style.background = '#f59e0b';
        node.style.color = '#0b0d11';
      } else {
        node.style.background = '#374151';
      }
    }
  });
  
  // Load first question in review mode
  loadQuestionInReview(0);
  
  // Change "Exit Exam" to "Dashboard"
  const exitBtn = document.getElementById('btn-exit-exam');
  exitBtn.innerText = 'Tutup Review';
  exitBtn.onclick = () => showScreen('screen-dashboard');
  
  showScreen('screen-practice');
}

// Load Question in Review Mode
function loadQuestionInReview(index) {
  currentIndex = index;
  updateTimerDisplay();
  
  const q = currentQuestions[index];
  
  document.getElementById('question-number-display').innerText = `Review Soal No. ${index + 1} (${q.category.toUpperCase()})`;
  document.getElementById('question-text').innerText = q.soal;
  
  // Handle image
  const imgBox = document.getElementById('question-image-box');
  const imgEl = document.getElementById('question-image');
  if (q.img_soal) {
    imgEl.src = q.img_soal;
    imgBox.classList.remove('hidden');
  } else {
    imgBox.classList.add('hidden');
  }
  
  // Set options with review colors
  const optionsBox = document.getElementById('options-box');
  optionsBox.innerHTML = '';
  
  const choices = ['A', 'B', 'C', 'D', 'E'];
  const userSelected = userAnswers[index];
  const correctKey = q.kunci.toUpperCase();
  const isTKP = q.category.toUpperCase() === 'TKP';
  
  choices.forEach(ch => {
    const text = q[ch.toLowerCase()];
    if (!text) return;
    
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.disabled = true;
    
    const score = parseInt(q[`skor_${ch.toLowerCase()}`] || 0);
    
    if (isTKP) {
      // For TKP, show score for each option in review
      btn.innerHTML = `
        <span class="option-letter">${ch}</span>
        <span class="option-text">${text} <strong style="float:right; color:#a3e635;">(Skor: ${score})</strong></span>
      `;
      if (userSelected === ch) {
        btn.classList.add('selected');
        if (score >= 4) btn.classList.add('correct');
        else btn.classList.add('wrong');
      }
    } else {
      // For TWK/TIU, show clear correct / incorrect feedback
      btn.innerHTML = `
        <span class="option-letter">${ch}</span>
        <span class="option-text">${text}</span>
      `;
      if (ch === correctKey) {
        btn.classList.add('correct');
      } else if (userSelected === ch) {
        btn.classList.add('wrong');
      }
    }
    
    optionsBox.appendChild(btn);
  });
  
  // Always show explanation in review mode
  const expBox = document.getElementById('explanation-box');
  document.getElementById('explanation-text').innerText = q.pembahasan || 'Tidak ada pembahasan tertulis.';
  expBox.classList.remove('hidden');
  
  // Controls
  const btnNext = document.getElementById('btn-next-question');
  const btnSubmit = document.getElementById('btn-submit-exam');
  btnSubmit.classList.add('hidden'); // No submit in review
  
  if (index === currentQuestions.length - 1) {
    btnNext.classList.add('hidden');
  } else {
    btnNext.classList.remove('hidden');
  }
  
  // Highlight active node in sidebar
  document.querySelectorAll('.grid-node').forEach(node => node.classList.remove('active'));
  const activeNode = document.getElementById(`grid-node-${index}`);
  if (activeNode) activeNode.classList.add('active');
}

// Override next/prev clicks if in review mode
const originalNext = nextQuestion;
const originalPrev = prevQuestion;

nextQuestion = function() {
  if (currentMode === 'review') {
    if (currentIndex < currentQuestions.length - 1) {
      loadQuestionInReview(currentIndex + 1);
    }
  } else {
    originalNext();
  }
};

prevQuestion = function() {
  if (currentMode === 'review') {
    if (currentIndex > 0) {
      loadQuestionInReview(currentIndex - 1);
    }
  } else {
    originalPrev();
  }
};
