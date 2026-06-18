import { state } from '../state';

export interface MathQuestion {
  id: number;
  question: string;
  correctAnswer: number;
  choices: number[];
  userAnswer?: number;
  latencyMs?: number;
  isCorrect?: boolean;
  op?: 'perkalian' | 'pembagian' | 'penjumlahan' | 'pengurangan';
  difficulty?: 'easy' | 'medium' | 'hard';
}

/**
 * Generate smart distractors that are mathematically close to the correct answer.
 */
function generateDistractors(correct: number, op: string, num1: number, num2: number): number[] {
  const choices = new Set<number>();
  choices.add(correct);
  
  if (op === 'perkalian') {
    // Distractors from adjacent multiples
    choices.add(num1 * Math.max(1, num2 - 1));
    choices.add(num1 * (num2 + 1));
    // Off-by-two or common transposition
    choices.add(correct + 2);
    choices.add(correct - 2);
    if (correct > 10) {
      choices.add(correct - 10);
      choices.add(correct + 10);
    }
  } else if (op === 'pembagian') {
    choices.add(Math.max(1, correct - 1));
    choices.add(correct + 1);
    choices.add(Math.max(1, correct - 2));
    choices.add(correct + 2);
  } else {
    // Addition & Subtraction
    choices.add(correct + 1);
    choices.add(correct - 1);
    choices.add(correct + 2);
    choices.add(correct - 2);
    choices.add(correct + 10);
    choices.add(correct - 10);
  }
  
  // Ensure we have exactly 4 choices
  while (choices.size < 4) {
    const randomOffset = Math.floor(Math.random() * 15) - 7;
    if (randomOffset !== 0) {
      choices.add(Math.max(1, correct + randomOffset));
    }
  }
  
  // Shuffle choices
  return Array.from(choices).sort(() => 0.5 - Math.random());
}

/**
 * Generate list of MathQuestion objects based on chosen operation and options.
 */
export const generateMathDrill = (
  opType: 'perkalian' | 'pembagian' | 'penjumlahan' | 'pengurangan' | 'campuran',
  ranges: number[], // active number range for multiplication/division
  difficulty: 'easy' | 'medium' | 'hard',
  count: number
): MathQuestion[] => {
  const questions: MathQuestion[] = [];
  const ops: ('perkalian' | 'pembagian' | 'penjumlahan' | 'pengurangan')[] = [];

  if (opType === 'campuran') {
    ops.push('perkalian', 'pembagian', 'penjumlahan', 'pengurangan');
  } else {
    ops.push(opType);
  }

  for (let i = 0; i < count; i++) {
    const op = ops[Math.floor(Math.random() * ops.length)];
    let num1 = 0;
    let num2 = 0;
    let questionText = '';
    let correctAnswer = 0;

    if (op === 'perkalian') {
      // Pick a number from selected ranges, or a random 2..10 if empty
      num1 = ranges.length > 0 ? ranges[Math.floor(Math.random() * ranges.length)] : Math.floor(Math.random() * 9) + 2;
      num2 = Math.floor(Math.random() * 9) + 2; // 2..10
      questionText = `${num1} × ${num2}`;
      correctAnswer = num1 * num2;
    } else if (op === 'pembagian') {
      num2 = ranges.length > 0 ? ranges[Math.floor(Math.random() * ranges.length)] : Math.floor(Math.random() * 9) + 2; // the divisor
      correctAnswer = Math.floor(Math.random() * 9) + 2; // the target result (2..10)
      num1 = num2 * correctAnswer; // dividend
      questionText = `${num1} ÷ ${num2}`;
    } else if (op === 'penjumlahan') {
      if (difficulty === 'easy') {
        num1 = Math.floor(Math.random() * 19) + 2; // 2..20
        num2 = Math.floor(Math.random() * 19) + 2;
      } else if (difficulty === 'medium') {
        num1 = Math.floor(Math.random() * 80) + 10; // 10..90
        num2 = Math.floor(Math.random() * 80) + 10;
      } else {
        num1 = Math.floor(Math.random() * 900) + 100; // 100..999
        num2 = Math.floor(Math.random() * 900) + 100;
      }
      questionText = `${num1} + ${num2}`;
      correctAnswer = num1 + num2;
    } else {
      // pengurangan
      if (difficulty === 'easy') {
        num1 = Math.floor(Math.random() * 15) + 15; // 15..30
        num2 = Math.floor(Math.random() * 12) + 2;  // 2..14
      } else if (difficulty === 'medium') {
        num1 = Math.floor(Math.random() * 70) + 30; // 30..99
        num2 = Math.floor(Math.random() * (num1 - 5)) + 2;
      } else {
        num1 = Math.floor(Math.random() * 800) + 200; // 200..999
        num2 = Math.floor(Math.random() * (num1 - 100)) + 10;
      }
      questionText = `${num1} − ${num2}`;
      correctAnswer = num1 - num2;
    }

    questions.push({
      id: i + 1,
      question: questionText,
      correctAnswer,
      choices: generateDistractors(correctAnswer, op, num1, num2),
      op,
      difficulty
    });
  }

  return questions;
};

/**
 * Submit math drill results, save locally, and post to Laravel backend API.
 */
export const submitMathDrillHistory = async (
  name: string,
  score: number,
  maxScore: number,
  durationSeconds: number,
  breakdown: {
    type: 'math_drill';
    operation: string;
    selected_ranges: number[];
    avg_latency_ms: number;
    weak_spots: string[];
  }
) => {
  const dateFormatted = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }) + ', ' + new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const newHistoryItem = {
    name,
    date: dateFormatted,
    score,
    maxScore,
    passed: score / maxScore >= 0.9, // 90% accuracy counts as passed/mastered
    breakdown,
    durationSeconds
  };

  // 1. Unshift into local reactive state
  state.history.unshift(newHistoryItem);
  localStorage.setItem('aksara_cat_history', JSON.stringify(state.history));

  // 2. Post to cloud API if authenticated
  if (state.token) {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`
        },
        body: JSON.stringify({
          name: newHistoryItem.name,
          score: newHistoryItem.score,
          maxScore: newHistoryItem.maxScore,
          passed: newHistoryItem.passed,
          breakdown: newHistoryItem.breakdown,
          durationSeconds: newHistoryItem.durationSeconds
        })
      });
      if (!response.ok) {
        console.warn('Gagal memposting riwayat kalkulasi ke cloud');
      }
    } catch (err) {
      console.warn('Gagal memposting riwayat kalkulasi (koneksi error):', err);
    }
  }
};
