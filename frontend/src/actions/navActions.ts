import { f7 } from 'framework7-vue';
import { state } from '../state';
import { currentQuestion } from '../computeds';
import { resetExamState } from './examActions';

const getApiUrl = () => import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const syncHistory = async () => {
  if (!state.token) return;
  try {
    const response = await fetch(`${getApiUrl()}/api/history`, {
      headers: {
        'Authorization': `Bearer ${state.token}`,
        'Accept': 'application/json'
      }
    });
    if (response.ok) {
      const data = await response.json();
      state.history = data;
      localStorage.setItem('aksara_cat_history', JSON.stringify(data));
    }
  } catch (err) {
    console.warn('Gagal sinkronisasi history dari cloud, menggunakan cache lokal.', err);
  }
};

export const loginWithGoogleToken = async (idToken: string) => {
  f7.preloader.show();
  try {
    const response = await fetch(`${getApiUrl()}/api/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ idToken })
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || 'Autentikasi gagal');
    }

    const res = await response.json();
    state.token = res.token;
    state.user = res.user;

    localStorage.setItem('aksara_cat_token', res.token);
    localStorage.setItem('aksara_cat_user', JSON.stringify(res.user));

    f7.toast.create({
      text: `Selamat datang, ${res.user.name}!`,
      position: 'bottom',
      closeTimeout: 2000
    }).open();

    await syncHistory();
    await fetchLeaderboard();
  } catch (err: any) {
    f7.dialog.alert('Google Sign-In gagal: ' + err.message, 'Error');
  } finally {
    f7.preloader.hide();
  }
};

export const logout = () => {
  state.token = null;
  state.user = null;
  state.leaderboard = [];
  state.currentUserRank = null;
  state.currentUserBest = null;
  localStorage.removeItem('aksara_cat_token');
  localStorage.removeItem('aksara_cat_user');

  // Reload local-only history fallback
  const stored = localStorage.getItem('aksara_cat_history');
  if (stored) {
    state.history = JSON.parse(stored);
  } else {
    state.history = [];
  }

  f7.toast.create({
    text: 'Anda telah keluar akun.',
    position: 'bottom',
    closeTimeout: 2000
  }).open();
};

export const fetchLeaderboard = async () => {
  if (!state.token) return;
  try {
    const response = await fetch(`${getApiUrl()}/api/leaderboard`, {
      headers: {
        'Authorization': `Bearer ${state.token}`,
        'Accept': 'application/json'
      }
    });
    if (response.ok) {
      const data = await response.json();
      state.leaderboard = data.leaderboard;
      state.currentUserRank = data.currentUser;
      if (data.currentUser) {
        state.currentUserBest = data.currentUser;
      }
    }
  } catch (err) {
    console.warn('Gagal memuat papan peringkat.', err);
  }
};

export const loadHistory = async () => {
  // Restore auth token/user from cache
  const cachedToken = localStorage.getItem('aksara_cat_token');
  const cachedUser = localStorage.getItem('aksara_cat_user');
  if (cachedToken && cachedUser) {
    state.token = cachedToken;
    state.user = JSON.parse(cachedUser);
  }

  // Load configuration googleClientId from API
  try {
    const response = await fetch(`${getApiUrl()}/api/auth/config`);
    if (response.ok) {
      const data = await response.json();
      state.googleClientId = data.googleClientId;
    }
  } catch (e) {
    console.warn('Gagal memuat konfigurasi auth dari backend.', e);
  }

  if (state.token) {
    await syncHistory();
    await fetchLeaderboard();
  } else {
    const stored = localStorage.getItem('aksara_cat_history');
    if (stored) {
      state.history = JSON.parse(stored);
    }
  }
};


export const selectCategory = (cat: string) => {
  state.selectedCategory = cat;
  if (f7.views.main && f7.views.main.router) {
    f7.views.main.router.navigate('/select/');
  }
};

export const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const prevQuestion = () => {
  if (state.currentQuestionIndex > 0) state.currentQuestionIndex--;
};

export const nextQuestion = () => {
  if (state.currentQuestionIndex < state.currentQuestions.length - 1) {
    state.currentQuestionIndex++;
  }
};

export const jumpToQuestion = (idx: number) => {
  state.currentQuestionIndex = idx;
};

export const selectOption = (opt: string) => {
  const q: any = currentQuestion.value;

  if (!q) return;

  if (state.screen === 'latihan' && !!state.userAnswers[q.id]) return;
  if (state.screen === 'review') return;

  state.userAnswers[q.id] = opt;

  if (state.screen === 'latihan') {
    const isLast = state.currentQuestionIndex === state.currentQuestions.length - 1;
    if (isLast) {
      f7.toast.create({
        text: 'Ini adalah soal terakhir. Selesaikan latihan untuk melihat hasil.',
        position: 'bottom',
        closeTimeout: 2200
      }).open();
    }
  }
};

export const toggleFlag = () => {
  const idx = state.currentQuestionIndex;
  state.flaggedQuestions[idx] = !state.flaggedQuestions[idx];
};

export const getOptionClass = (opt: string): string => {
  const q: any = currentQuestion.value;
  if (!q) return '';
  const selected = state.userAnswers[q.id] === opt;

  if (state.screen === 'review') {
    if (q.category === 'TKP') {
      return selected ? 'selected' : '';
    } else {
      const isCorrect = q.kunci.toUpperCase() === opt;
      if (isCorrect) return 'correct';
      if (selected && !isCorrect) return 'wrong';
      return '';
    }
  } else if (state.screen === 'latihan') {
    const answered = !!state.userAnswers[q.id];
    if (answered) {
      if (q.category === 'TKP') {
        return selected ? 'selected' : '';
      } else {
        const isCorrect = q.kunci.toUpperCase() === opt;
        if (isCorrect) return 'correct';
        if (selected && !isCorrect) return 'wrong';
        return '';
      }
    } else {
      return selected ? 'selected' : '';
    }
  } else {
    return selected ? 'selected' : '';
  }
};

export const getPointsForQuestion = (q: any): number => {
  const answer = state.userAnswers[q.id];
  if (!answer) return 0;
  if (q.category === 'TKP') {
    return q[`skor_${answer.toLowerCase()}`] ?? 0;
  } else {
    return answer.toUpperCase() === q.kunci.toUpperCase() ? 5 : 0;
  }
};


export const exitToMenu = () => {
  if (state.screen === 'latihan' || state.screen === 'simulasi') {
    f7.dialog.confirm(
      'Apakah Anda yakin ingin keluar? Semua progres jawaban latihan saat ini akan hilang.',
      'Keluar Latihan',
      () => {
        resetExamState();
        if (f7.views.main && f7.views.main.router) {
          f7.views.main.router.navigate('/');
        }
      }
    );
  } else {
    resetExamState();
    if (f7.views.main && f7.views.main.router) {
      f7.views.main.router.navigate('/');
    }
  }
};

