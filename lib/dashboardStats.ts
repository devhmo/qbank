import { computeSubjectBreakdown } from "@/lib/quizResults";
import type { SubjectBreakdown } from "@/types/models";

export interface DashboardAnswerRow {
  isCorrect: boolean | null;
  subjectName: string;
  topicName: string;
  quizDate: string; // ISO timestamp of the owning quiz's created_at
}

export interface OverallStats {
  totalAnswered: number;
  totalCorrect: number;
  correctPct: number;
  completedQuizCount: number;
}

export function computeOverallStats(
  rows: DashboardAnswerRow[],
  completedQuizCount: number
): OverallStats {
  const totalAnswered = rows.length;
  const totalCorrect = rows.filter((r) => r.isCorrect === true).length;
  const correctPct = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
  return { totalAnswered, totalCorrect, correctPct, completedQuizCount };
}

// Reuses the same grouping logic as the quiz results page (by subject
// name); topic-level breakdown is the same shape, just a different key.
export function computeTopicBreakdown(rows: DashboardAnswerRow[]): SubjectBreakdown[] {
  return computeSubjectBreakdown(
    rows.map((r) => ({ subjectName: r.topicName, isCorrect: r.isCorrect }))
  );
}

export function computeSubjectBreakdownFromRows(rows: DashboardAnswerRow[]): SubjectBreakdown[] {
  return computeSubjectBreakdown(
    rows.map((r) => ({ subjectName: r.subjectName, isCorrect: r.isCorrect }))
  );
}

// Only topics with at least `minAttempts` answered questions are eligible,
// so a single unlucky guess doesn't dominate the list. Returns the lowest
// `limit` by correct percentage, ascending (weakest first).
export function computeWeakestTopics(
  rows: DashboardAnswerRow[],
  minAttempts = 3,
  limit = 5
): (SubjectBreakdown & { pct: number })[] {
  return computeTopicBreakdown(rows)
    .filter((t) => t.total >= minAttempts)
    .map((t) => ({ ...t, pct: Math.round((t.correct / t.total) * 100) }))
    .sort((a, b) => a.pct - b.pct)
    .slice(0, limit);
}

export interface TrendPoint {
  date: string; // YYYY-MM-DD
  correct: number;
  total: number;
  pct: number;
}

// Buckets answers by the calendar day (UTC) of the owning quiz's
// created_at, restricted to the last `days` days, and only includes days
// that actually have data (a day with nothing answered isn't "0%
// accuracy" — it's just not plotted, so the line only connects real data
// points).
export function computeAccuracyTrend(rows: DashboardAnswerRow[], days = 30): TrendPoint[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const map = new Map<string, { correct: number; total: number }>();

  for (const row of rows) {
    const time = new Date(row.quizDate).getTime();
    if (time < cutoff) continue;

    const day = row.quizDate.slice(0, 10); // YYYY-MM-DD (UTC date portion)
    const entry = map.get(day) ?? { correct: 0, total: 0 };
    entry.total += 1;
    if (row.isCorrect === true) entry.correct += 1;
    map.set(day, entry);
  }

  return [...map.entries()]
    .map(([date, { correct, total }]) => ({
      date,
      correct,
      total,
      pct: total > 0 ? Math.round((correct / total) * 100) : 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
