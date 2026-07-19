"use client";

import { useEffect, useRef, useState } from "react";
import { computeRemainingSeconds, formatTime } from "@/lib/quizTimer";

export default function QuizTimer({
  createdAt,
  timeLimitMinutes,
  totalPausedSeconds,
  pausedAt,
  pausing,
  onPause,
  onResume,
  onExpire,
}: {
  createdAt: string;
  timeLimitMinutes: number | null;
  totalPausedSeconds: number;
  pausedAt: string | null;
  pausing: boolean;
  onPause: () => void;
  onResume: () => void;
  onExpire: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  const expiredRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const remaining = timeLimitMinutes
    ? computeRemainingSeconds(
        {
          created_at: createdAt,
          time_limit_minutes: timeLimitMinutes,
          total_paused_seconds: totalPausedSeconds,
          paused_at: pausedAt,
        },
        now
      )
    : null;

  const isPaused = pausedAt !== null;

  useEffect(() => {
    if (remaining !== null && remaining <= 0 && !isPaused && !expiredRef.current) {
      expiredRef.current = true;
      onExpire();
    }
  }, [remaining, isPaused, onExpire]);

  if (timeLimitMinutes === null || remaining === null) return null;

  const isLow = remaining <= 60;

  return (
    <div className="flex items-center gap-3">
      <span
        className={`font-mono text-sm font-medium tabular-nums ${
          isLow ? "text-red-600" : "text-slate-700"
        }`}
      >
        {formatTime(remaining)}
      </span>
      <button
        type="button"
        onClick={isPaused ? onResume : onPause}
        disabled={pausing}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
      >
        {pausing ? "..." : isPaused ? "Resume" : "Pause"}
      </button>
    </div>
  );
}
