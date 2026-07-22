"use client";

import { useEffect, useRef, useState } from "react";
import { Clock, Pause, Play } from "lucide-react";
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
    <div className="flex items-center gap-2">
      <span
        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-mono text-sm font-medium tabular-nums ${
          isLow
            ? "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"
            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
        }`}
      >
        <Clock className="h-3.5 w-3.5" />
        {formatTime(remaining)}
      </span>
      <button
        type="button"
        onClick={isPaused ? onResume : onPause}
        disabled={pausing}
        title={isPaused ? "Resume" : "Pause"}
        aria-label={isPaused ? "Resume" : "Pause"}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
      >
        {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
      </button>
    </div>
  );
}
