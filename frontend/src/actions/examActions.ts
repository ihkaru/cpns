import { f7 } from 'framework7-vue';
import { state } from '../state';
import { decryptData } from '../utils/crypto';

// Timer Interval Reference local to this action module
let timerInterval: any = null;

const getRandomElements = (arr: any[], n: number): any[] => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
};


export const loadQuestionsData = async () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  if (f7 && f7.preloader) {
    f7.preloader.show();
  }

  // Load Packets
  try {
    const pResponse = await fetch(`${apiUrl}/api/packets`);
    if (!pResponse.ok) throw new Error('API request failed');
    state.allPackets = await pResponse.json();
  } catch (error) {
    console.warn('Gagal fetch packets, mode offline.', error);
    state.allPackets = [
      { id: 1, kategori: 'TWK', judul: 'TWK Paket Latihan 1', jenis: 'latihan', bank_soals_count: 30 },
      { id: 2, kategori: 'TIU', judul: 'TIU Paket Latihan 1', jenis: 'latihan', bank_soals_count: 30 },
      { id: 3, kategori: 'TKP', judul: 'TKP Paket Latihan 1', jenis: 'latihan', bank_soals_count: 30 }
    ];
  }

  // Load Questions
  try {
    const response = await fetch(`${apiUrl}/api/soal`);
    if (!response.ok) throw new Error('API request failed');
    const resData = await response.json();
    if (resData.payload) {
      const decryptedText = await decryptData(resData.payload);
      state.allQuestions = JSON.parse(decryptedText);
    } else {
      state.allQuestions = resData;
    }
    state.isOffline = false;
  } catch (error) {
    console.warn('API error, falling back to local json:', error);
    state.isOffline = true;
    try {
      const response = await fetch('bank_soal_cpns.json');
      const resData = await response.json();
      if (resData.payload) {
        const decryptedText = await decryptData(resData.payload);
        state.allQuestions = JSON.parse(decryptedText);
      } else {
        state.allQuestions = resData;
      }
    } catch (localError) {
      console.error('Local backup failed too:', localError);
    }
  }

  // Parse category & compute stats counts
  const tempCounts = { TWK: 0, TIU: 0, TKP: 0 } as { TWK: number; TIU: number; TKP: number; [key: string]: number };
  state.allQuestions.forEach((q: any) => {
    const cat = q.kategori ? q.kategori.toUpperCase() : (q.category ? q.category.toUpperCase() : 'TWK');
    q.category = cat;
    if (tempCounts[cat] !== undefined) {
      tempCounts[cat]++;
    }
  });
  state.counts = tempCounts;

  if (f7 && f7.preloader) {
    f7.preloader.hide();
  }
};

export const startSimulation = () => {
  const twkList = state.allQuestions.filter((q: any) => q.category === 'TWK');
  const tiuList = state.allQuestions.filter((q: any) => q.category === 'TIU');
  const tkpList = state.allQuestions.filter((q: any) => q.category === 'TKP');


  if (twkList.length < 30 || tiuList.length < 35 || tkpList.length < 45) {
    f7.dialog.alert('Soal di database belum mencukupi untuk simulasi CAT penuh (butuh min 30 TWK, 35 TIU, 45 TKP).');
    return;
  }

  state.currentSessionName = 'Simulasi CAT SKD';
  
  const selTWK = getRandomElements(twkList, 30);
  const selTIU = getRandomElements(tiuList, 35);
  const selTKP = getRandomElements(tkpList, 45);

  state.currentQuestions = [...selTWK, ...selTIU, ...selTKP];
  state.currentQuestionIndex = 0;
  state.userAnswers = {};
  state.flaggedQuestions = {};
  state.startTime = Date.now();

  state.timeLeft = 100 * 60; // 100 minutes
  startTimer();
  if (f7.views.main && f7.views.main.router) {
    f7.views.main.router.navigate('/simulasi/');
  }
};

export const startCategoryPractice = (catName: string) => {
  const catSoals = state.allQuestions.filter((q: any) => q.category === catName);

  if (catSoals.length === 0) {
    f7.dialog.alert(`Tidak ada soal untuk kategori ${catName}.`);
    return;
  }

  state.currentSessionName = `Latihan Acak ${catName}`;
  const limit = Math.min(catSoals.length, 30);
  state.currentQuestions = getRandomElements(catSoals, limit);
  state.currentQuestionIndex = 0;
  state.userAnswers = {};
  state.flaggedQuestions = {};
  state.startTime = Date.now();
  if (f7.views.main && f7.views.main.router) {
    f7.views.main.router.navigate('/latihan/');
  }
};

export const startPacketPractice = async (packet: any) => {

  if (state.isOffline) {
    startCategoryPractice(packet.kategori);
    return;
  }

  f7.preloader.show();
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const response = await fetch(`${apiUrl}/api/packets/${packet.id}/soal`);
    if (!response.ok) throw new Error('Failed to fetch packet questions');
    
    const resData = await response.json();
    let questionsData = resData;
    if (resData.payload) {
      const decryptedText = await decryptData(resData.payload);
      questionsData = JSON.parse(decryptedText);
    }
    const rawSoals = questionsData.questions || [];

    rawSoals.forEach((q: any) => {
      q.category = q.kategori ? q.kategori.toUpperCase() : packet.kategori.toUpperCase();
    });

    state.currentSessionName = `Topik: ${packet.judul}`;
    state.currentQuestions = rawSoals;
    state.currentQuestionIndex = 0;
    state.userAnswers = {};
    state.flaggedQuestions = {};
    state.startTime = Date.now();

    if (f7.views.main && f7.views.main.router) {
      if (packet.jenis === 'tryout') {
        state.timeLeft = (packet.waktu_menit || 100) * 60;
        startTimer();
        f7.views.main.router.navigate('/simulasi/');
      } else {
        f7.views.main.router.navigate('/latihan/');
      }
    }
  } catch (err) {
    console.error('Error fetching packet questions:', err);
    f7.dialog.alert('Gagal memuat soal untuk topik ini. Silakan coba lagi.');
  } finally {
    f7.preloader.hide();
  }
};

export const startTimer = () => {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    state.timeLeft--;
    if (state.timeLeft <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      f7.dialog.alert('Waktu ujian telah habis! Hasil ujian Anda akan disubmit otomatis.', 'Waktu Habis', () => {
        submitAnswers();
      });
    }
  }, 1000);
};

export const submitAnswers = () => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  let scoreTWK = 0;
  let scoreTIU = 0;
  let scoreTKP = 0;
  let maxScore = 0;

  state.currentQuestions.forEach((q: any) => {
    const answer = state.userAnswers[q.id];
    const category = q.category;

    if (category === 'TKP') {
      if (answer) {
        const field = `skor_${answer.toLowerCase()}`;
        scoreTKP += parseInt(q[field] ?? 0);
      }
      maxScore += 5;
    } else {
      const isCorrect = answer && answer.toUpperCase() === q.kunci.toUpperCase();
      if (isCorrect) {
        if (category === 'TWK') scoreTWK += 5;
        else scoreTIU += 5;
      }
      maxScore += 5;
    }
  });


  const totalScore = scoreTWK + scoreTIU + scoreTKP;
  const isSim = state.screen === 'simulasi' || state.currentSessionName.includes('Simulasi');
  const durationSeconds = state.startTime > 0 ? Math.round((Date.now() - state.startTime) / 1000) : 0;

  let isPassed = false;
  if (isSim) {
    isPassed = scoreTWK >= 65 && scoreTIU >= 80 && scoreTKP >= 166;
  } else {
    isPassed = totalScore >= (maxScore * 0.7);
  }

  const newHistoryItem = {
    name: state.currentSessionName,
    date: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
    score: totalScore,
    maxScore: maxScore,
    passed: isPassed,
    breakdown: { TWK: scoreTWK, TIU: scoreTIU, TKP: scoreTKP },
    durationSeconds: durationSeconds
  };

  // Local cache update
  state.history.unshift(newHistoryItem);
  localStorage.setItem('aksara_cat_history', JSON.stringify(state.history));

  // Sync with cloud backend if authenticated
  if (state.token) {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    fetch(`${apiUrl}/api/history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        name: newHistoryItem.name,
        score: newHistoryItem.score,
        maxScore: newHistoryItem.maxScore,
        passed: newHistoryItem.passed,
        breakdown: newHistoryItem.breakdown,
        durationSeconds: newHistoryItem.durationSeconds
      })
    }).then(response => {
      if (!response.ok) {
        console.warn('Gagal memposting history ke cloud');
      } else {
        // Refresh leaderboard after posting new attempt
        fetch(`${apiUrl}/api/leaderboard`, {
          headers: {
            'Authorization': `Bearer ${state.token}`,
            'Accept': 'application/json'
          }
        }).then(res => {
          if (res.ok) {
            res.json().then(data => {
              state.leaderboard = data.leaderboard;
              state.currentUserRank = data.currentUser;
              if (data.currentUser) {
                state.currentUserBest = data.currentUser;
              }
            });
          }
        }).catch(err => {
          console.warn('Gagal memuat papan peringkat.', err);
        });
      }
    }).catch(err => {
      console.warn('Gagal memposting history (koneksi error):', err);
    });
  }


  state.lastResults = {
    score: totalScore,
    maxScore: maxScore,
    passed: isPassed,
    isSim: isSim,
    breakdown: { TWK: scoreTWK, TIU: scoreTIU, TKP: scoreTKP },
    durationSeconds: durationSeconds
  };

  state.showResults = true;
};

export const confirmSubmit = () => {
  const totalAnswered = Object.keys(state.userAnswers).length;
  const totalQuestions = state.currentQuestions.length;
  
  f7.dialog.confirm(
    `Anda menjawab ${totalAnswered} dari ${totalQuestions} soal. Yakin ingin men-submit hasil ujian sekarang?`,
    'Selesai Ujian',
    () => {
      submitAnswers();
    }
  );
};

export const resetExamState = () => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  state.currentQuestions = [];
  state.currentQuestionIndex = 0;
  state.userAnswers = {};
  state.flaggedQuestions = {};
};
