import type { SubjectBreakdown } from "@/types/models";

export interface ResultsQuestionRow {
  subjectName: string;
  isCorrect: boolean | null; // null = unanswered
}

export function computeOverallScore(rows: ResultsQuestionRow[]): {
  correct: number;
  total: number;
  unanswered: number;
} {
  const total = rows.length;
  const correct = rows.filter((r) => r.isCorrect === true).length;
  const unanswered = rows.filter((r) => r.isCorrect === null).length;
  return { correct, total, unanswered };
}

export function computeSubjectBreakdown(rows: ResultsQuestionRow[]): SubjectBreakdown[] {
  const map = new Map<string, { correct: number; total: number }>();

  for (const row of rows) {
    const key = row.subjectName || "Uncategorized";
    const entry = map.get(key) ?? { correct: 0, total: 0 };
    entry.total += 1;
    if (row.isCorrect === true) entry.correct += 1;
    map.set(key, entry);
  }

  return [...map.entries()]
    .map(([subjectName, { correct, total }]) => ({ subjectName, correct, total }))
    .sort((a, b) => a.subjectName.localeCompare(b.subjectName));
}
