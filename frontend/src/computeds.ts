import { computed } from 'vue';
import { state } from './state';


export const filteredPackets = computed(() => {
  return state.allPackets.filter(p => {
    const matchCat = p.kategori.toUpperCase() === state.selectedCategory.toUpperCase();
    const matchFilter = state.selectedFilter === 'all' || p.jenis === state.selectedFilter;
    return matchCat && matchFilter;
  });
});

export const currentQuestion = computed(() => {
  return state.currentQuestions[state.currentQuestionIndex] || null;
});

export const isCurrentQuestionAnswered = computed(() => {
  const q = currentQuestion.value;
  return q ? !!state.userAnswers[q.id] : false;
});

export const accuracyPercent = computed(() => {
  const answeredKeys = Object.keys(state.userAnswers);
  if (answeredKeys.length === 0) return 0;

  let correctCount = 0;
  state.currentQuestions.forEach((q) => {
    const ans = state.userAnswers[q.id];
    if (ans) {
      if (q.category === 'TKP') {
        correctCount++;
      } else {
        if (ans.toUpperCase() === q.kunci.toUpperCase()) {
          correctCount++;
        }
      }
    }
  });
  return Math.round((correctCount / answeredKeys.length) * 100);
});

export const currentQuestionFeedback = computed(() => {
  const q = currentQuestion.value;
  if (!q) return null;
  const ans = state.userAnswers[q.id];
  if (!ans) return null;

  if (q.category === 'TKP') {
    const score = parseInt(q['skor_' + ans.toLowerCase()] || 0);
    return {
      statusText: `Terjawab (Skor: +${score} Poin)`,
      isCorrect: true,
      score,
      isTkp: true
    };
  } else {
    const isCorrect = ans.toUpperCase() === q.kunci.toUpperCase();
    return {
      statusText: isCorrect ? 'Jawaban Benar! (+5 Poin)' : 'Jawaban Kurang Tepat. (0 Poin)',
      isCorrect,
      score: isCorrect ? 5 : 0,
      isTkp: false
    };
  }
});

// Max score possible per category for gauge metrics
export const twkMaxPossible = computed(() => {
  return Math.max(5, state.currentQuestions.filter(q => q.category === 'TWK').length * 5);
});
export const tiuMaxPossible = computed(() => {
  return Math.max(5, state.currentQuestions.filter(q => q.category === 'TIU').length * 5);
});
export const tkpMaxPossible = computed(() => {
  return Math.max(5, state.currentQuestions.filter(q => q.category === 'TKP').length * 5);
});

// Gauge value scales
export const gaugeTWKValue = computed(() => {
  return Math.min(1, Math.max(0, state.lastResults.breakdown.TWK / twkMaxPossible.value));
});
export const gaugeTIUValue = computed(() => {
  return Math.min(1, Math.max(0, state.lastResults.breakdown.TIU / tiuMaxPossible.value));
});
export const gaugeTKPValue = computed(() => {
  return Math.min(1, Math.max(0, state.lastResults.breakdown.TKP / tkpMaxPossible.value));
});

export const gaugeTWKPercent = computed(() => {
  return `${Math.round(gaugeTWKValue.value * 100)}%`;
});
export const gaugeTIUPercent = computed(() => {
  return `${Math.round(gaugeTIUValue.value * 100)}%`;
});
export const gaugeTKPPercent = computed(() => {
  return `${Math.round(gaugeTKPValue.value * 100)}%`;
});

export const leaderboardTop3 = computed(() => {
  return state.leaderboard.slice(0, 3);
});

export const coachingRecommendation = computed(() => {
  // If user is offline or not logged in, return placeholder
  if (!state.user || !state.token) {
    return {
      title: 'Masuk Akun untuk Analisis',
      tips: ['Silakan login dengan Google untuk melihat rekomendasi belajar berdasarkan papan peringkat.'],
      showCoaching: false
    };
  }

  // If user has not completed any simulation yet
  const userBest = state.currentUserBest;
  if (!userBest) {
    return {
      title: 'Mulai Ujian Pertama Anda',
      tips: [
        'Anda belum memiliki riwayat Simulasi CAT SKD.',
        'Selesaikan 1 sesi Simulasi CAT SKD penuh untuk menganalisis kelemahan Anda dibanding peserta lain.'
      ],
      showCoaching: true
    };
  }

  const list = state.leaderboard;
  if (list.length === 0) {
    return {
      title: 'Pelopor Leaderboard',
      tips: [
        'Belum ada pengguna lain di papan peringkat.',
        'Pertahankan skor Anda dan bagikan aplikasi ini kepada rekan belajar Anda!'
      ],
      showCoaching: true
    };
  }

  // Calculate gaps
  const rank = state.currentUserRank?.rank;
  const tips: string[] = [];

  // Define target values (average BKN target scores or 10th place score)
  const targetItem = list.length >= 10 ? list[9] : list[list.length - 1];
  const targetScore = targetItem.score;
  const targetBreakdown = targetItem.breakdown || { TWK: 95, TIU: 130, TKP: 195 };
  const targetPace = targetItem.durationSeconds ? (targetItem.durationSeconds / 110) : 54.5;

  const totalQuestions = (userBest.maxScore || 550) / 5;
  const userPace = userBest.durationSeconds ? (userBest.durationSeconds / totalQuestions) : 999;

  if (rank && rank <= 10) {
    if (rank === 1) {
      return {
        title: '👑 Pertahankan Mahkota Anda!',
        tips: [
          'Luar biasa! Anda saat ini menduduki peringkat #1 di papan peringkat.',
          'Tetap asah kemampuan Anda dengan latihan mandiri per kategori agar posisi Anda tidak tergeser oleh peserta lain.'
        ],
        showCoaching: true
      };
    } else {
      // Compare with the user right above them
      const rival = list[rank - 2];
      const scoreGap = rival.score - userBest.score;
      const rivalPace = rival.durationSeconds ? (rival.durationSeconds / 110) : 45;

      tips.push(`Anda berada di peringkat #${rank}. Tinggal selangkah lagi untuk melampaui **${rival.name}** (peringkat #${rank - 1}).`);
      
      if (scoreGap > 0) {
        tips.push(`Butuh **${scoreGap} poin** tambahan untuk menyamai skor totalnya.`);
      }

      // Check category breakdowns
      const gaps = [
        { name: 'TKP', gap: (rival.breakdown?.TKP || 0) - (userBest.breakdown?.TKP || 0) },
        { name: 'TIU', gap: (rival.breakdown?.TIU || 0) - (userBest.breakdown?.TIU || 0) },
        { name: 'TWK', gap: (rival.breakdown?.TWK || 0) - (userBest.breakdown?.TWK || 0) }
      ].filter(g => g.gap > 0).sort((a, b) => b.gap - a.gap);

      if (gaps.length > 0) {
        tips.push(`Kelemahan terbesar Anda dibanding ${rival.name} ada pada kategori **${gaps[0].name}** (selisih ${gaps[0].gap} poin). Prioritaskan kategori ini.`);
      }

      if (userPace > rivalPace) {
        const paceGap = userPace - rivalPace;
        tips.push(`Kecepatan Anda lebih lambat ${paceGap.toFixed(1)}s/soal. Latih kecepatan menjawab agar sisa waktu lebih aman.`);
      }
    }
  } else {
    // User is rank > 10
    const scoreGap = targetScore - userBest.score;
    tips.push(`Anda berada di peringkat **#${rank || 'N/A'}**. Butuh **${scoreGap > 0 ? scoreGap : 5} poin** lagi untuk menembus Top 10 Papan Peringkat.`);

    // Suggest based on target breakdowns of the 10th place
    const gaps = [
      { name: 'TKP', val: (targetBreakdown.TKP || 195), current: userBest.breakdown?.TKP || 0 },
      { name: 'TIU', val: (targetBreakdown.TIU || 130), current: userBest.breakdown?.TIU || 0 },
      { name: 'TWK', val: (targetBreakdown.TWK || 95), current: userBest.breakdown?.TWK || 0 }
    ];

    // Find where the user is furthest below the target
    const sortedGaps = gaps.map(g => ({
      name: g.name,
      diff: g.val - g.current,
      current: g.current,
      val: g.val
    })).sort((a, b) => b.diff - a.diff);

    if (sortedGaps[0].diff > 0) {
      tips.push(`Fokus utama: Tingkatkan materi **${sortedGaps[0].name}**. Nilai Anda (${sortedGaps[0].current} poin) masih tertinggal ${sortedGaps[0].diff} poin dari rata-rata Top 10 (${sortedGaps[0].name} target: ${sortedGaps[0].val}).`);
    }

    if (userPace > targetPace) {
      const paceGap = userPace - targetPace;
      tips.push(`Percepat tempo pengerjaan Anda sebesar **${paceGap.toFixed(1)} detik/soal** untuk mengimbangi efisiensi waktu peserta Top 10.`);
    } else {
      tips.push('Kecepatan pengerjaan Anda sudah sangat baik! Pertahankan akurasi jawaban Anda.');
    }
  }

  return {
    title: '🎯 Rekomendasi Peningkatan Peringkat',
    tips,
    showCoaching: true
  };
});
