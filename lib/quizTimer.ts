import type { Quiz } from "@/types/models";

type TimerFields = Pick<
  Quiz,
  "created_at" | "time_limit_minutes" | "total_paused_seconds" | "paused_at"
>;

// Returns remaining seconds, or null for an untimed (Tutor mode) quiz.
// While paused_at is set, the result is intentionally frozen (see the
// module comment in QuizRunner for why the formula does this naturally).
export function computeRemainingSeconds(
  quiz: TimerFields,
  nowMs: number
): number | null {
  if (!quiz.time_limit_minutes) return null;

  const totalMs = quiz.time_limit_minutes * 60 * 1000;
  const elapsedMs = nowMs - new Date(quiz.created_at).getTime();
  const pausedMs =
    quiz.total_paused_seconds * 1000 +
    (quiz.paused_at ? nowMs - new Date(quiz.paused_at).getTime() : 0);
  const activeElapsedMs = elapsedMs - pausedMs;

  return Math.max(0, Math.round((totalMs - activeElapsedMs) / 1000));
}

export function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
