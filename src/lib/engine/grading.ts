export function exactMatchCorrect(selected: string[], correct: string[]): boolean {
  const a = new Set(selected);
  const b = new Set(correct);
  if (a.size !== b.size) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
}

export function gradeAttempt(params: {
  questionMarksById: Record<string, number>;
  correctOptionIdsByQuestionId: Record<string, string[]>;
  selectedOptionIdsByQuestionId: Record<string, string[]>;
  passPercent: number;
}) {
  const qids = Object.keys(params.questionMarksById);
  let score = 0;
  let maxScore = 0;

  const perQuestion: Array<{ questionId: string; earned: number; max: number; correct: boolean }> = [];

  for (const qid of qids) {
    const max = params.questionMarksById[qid] ?? 0;
    maxScore += max;

    const selected = params.selectedOptionIdsByQuestionId[qid] ?? [];
    const correct = params.correctOptionIdsByQuestionId[qid] ?? [];

    const ok = exactMatchCorrect(selected, correct);
    const earned = ok ? max : 0;

    score += earned;
    perQuestion.push({ questionId: qid, earned, max, correct: ok });
  }

  const percent = maxScore === 0 ? 0 : (score / maxScore) * 100;
  const passed = percent >= params.passPercent;

  return { score, maxScore, percent: Math.round(percent * 100) / 100, passed, perQuestion };
}
