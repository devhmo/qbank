"use client";

import { useEffect, useRef, useState } from "react";
import { CaseSensitive, Minus, Plus } from "lucide-react";

// Discrete steps rather than a free slider — simpler to reason about, and
// matches how UWorld/AMBOSS-style text size controls behave.
export const FONT_SCALE_STEPS = [0.85, 1, 1.15, 1.3, 1.45];
const DEFAULT_STEP_INDEX = 1; // 1.0x
const STORAGE_KEY = "qbank:quiz-font-step";

// Owns the current step index, restoring it from (and persisting it to)
// localStorage so a student's preferred text size survives reloads and
// carries across quizzes. Falls back silently if storage is unavailable.
export function useFontScale() {
  const [stepIndex, setStepIndex] = useState(DEFAULT_STEP_INDEX);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === null) return;
      const parsed = Number(stored);
      if (Number.isInteger(parsed) && parsed >= 0 && parsed < FONT_SCALE_STEPS.length) {
        setStepIndex(parsed);
      }
    } catch {
      // localStorage unavailable (private browsing, etc.) — just use the default.
    }
  }, []);

  function setStep(index: number) {
    const clamped = Math.max(0, Math.min(FONT_SCALE_STEPS.length - 1, index));
    setStepIndex(clamped);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(clamped));
    } catch {
      // Ignore — nothing to persist to, session-only is fine.
    }
  }

  return { scale: FONT_SCALE_STEPS[stepIndex], stepIndex, setStep };
}

export default function FontSizeControl({
  stepIndex,
  onChange,
}: {
  stepIndex: number;
  onChange: (index: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Text size"
        aria-expanded={open}
        title="Text size"
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border transition ${
          open
            ? "border-primary-400 bg-primary-50 text-primary-700 dark:border-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
            : "border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
        }`}
      >
        <CaseSensitive className="h-4 w-4" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Text size controls"
          className="absolute right-0 top-full z-20 mt-1.5 flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-800"
        >
          <button
            type="button"
            onClick={() => onChange(stepIndex - 1)}
            disabled={stepIndex === 0}
            aria-label="Decrease text size"
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="w-8 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
            {stepIndex + 1}/{FONT_SCALE_STEPS.length}
          </span>
          <button
            type="button"
            onClick={() => onChange(stepIndex + 1)}
            disabled={stepIndex === FONT_SCALE_STEPS.length - 1}
            aria-label="Increase text size"
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
