import { reactive } from 'vue';

export interface ExamState {
  screen: 'dashboard' | 'select' | 'latihan' | 'simulasi' | 'review';
  allQuestions: any[];
  allPackets: any[];
  isOffline: boolean;
  counts: { TWK: number; TIU: number; TKP: number; [key: string]: number };
  history: any[];
  selectedCategory: string;
  selectedFilter: string;
  currentSessionName: string;
  currentQuestions: any[];
  currentQuestionIndex: number;
  userAnswers: Record<string | number, string>;
  flaggedQuestions: Record<number, boolean>;
  timeLeft: number;
  startTime: number;
  showResults: boolean;
  lastResults: {
    score: number;
    maxScore: number;
    passed: boolean;
    isSim: boolean;
    breakdown: { TWK: number; TIU: number; TKP: number; [key: string]: number };
    durationSeconds?: number | null;
  };
  
  // Auth state
  user: { name: string; email: string; avatarUrl: string | null } | null;
  token: string | null;
  googleClientId: string | null;

  // Leaderboard state
  leaderboard: any[];
  currentUserRank: { rank: number; score: number; maxScore: number; passed: boolean; breakdown: any; durationSeconds: number | null } | null;
  currentUserBest: { score: number; maxScore: number; passed: boolean; breakdown: any; durationSeconds: number | null } | null;
}

// F7 Params Configuration
export const f7params = {
  name: 'AksaraCAT',
  theme: 'auto',
  dark: true,
  view: {
    pushState: true,
    pushStateSeparator: '#'
  }
};

// Centralized Reactive State with full TS interface type safety
export const state = reactive<ExamState>({
  screen: 'dashboard',
  allQuestions: [],
  allPackets: [],
  isOffline: typeof window !== 'undefined' ? !navigator.onLine : false,
  counts: { TWK: 0, TIU: 0, TKP: 0 },
  history: [],

  selectedCategory: 'TWK',
  selectedFilter: 'all',
  currentSessionName: '',
  currentQuestions: [],
  currentQuestionIndex: 0,
  userAnswers: {},
  flaggedQuestions: {},

  timeLeft: 0,
  startTime: 0,
  showResults: false,
  lastResults: {
    score: 0,
    maxScore: 0,
    passed: false,
    isSim: false,
    breakdown: { TWK: 0, TIU: 0, TKP: 0 },
    durationSeconds: null
  },

  user: null,
  token: null,
  googleClientId: null,

  leaderboard: [],
  currentUserRank: null,
  currentUserBest: null
});

