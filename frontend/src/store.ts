// Central barrel entrypoint for modular state management
export { f7params, state } from './state';

export {
  filteredPackets,
  currentQuestion,
  isCurrentQuestionAnswered,
  accuracyPercent,
  currentQuestionFeedback,
  twkMaxPossible,
  tiuMaxPossible,
  tkpMaxPossible,
  gaugeTWKValue,
  gaugeTIUValue,
  gaugeTKPValue,
  gaugeTWKPercent,
  gaugeTIUPercent,
  gaugeTKPPercent,
  leaderboardTop3,
  coachingRecommendation
} from './computeds';

export {
  loadQuestionsData,
  startSimulation,
  startCategoryPractice,
  startPacketPractice,
  startTimer,
  submitAnswers,
  confirmSubmit,
  resetExamState
} from './actions/examActions';

export {
  loadHistory,
  syncHistory,
  loginWithGoogleToken,
  logout,
  selectCategory,
  formatTime,
  prevQuestion,
  nextQuestion,
  jumpToQuestion,
  selectOption,
  toggleFlag,
  getOptionClass,
  getPointsForQuestion,
  exitToMenu,
  fetchLeaderboard
} from './actions/navActions';


