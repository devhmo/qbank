"use client";

import { useEffect, useRef, useState } from "react";
import { upsertNote } from "@/app/notes/actions";

const SAVE_DELAY_MS = 800;

export default function NoteEditor({
  questionId,
  initialNote,
}: {
  questionId: string;
  initialNote: string;
}) {
  const [open, setOpen] = useState(initialNote.trim().length > 0);
  const [text, setText] = useState(initialNote);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset local state if the question changes under us (e.g. navigating to
  // a different question in the quiz-taking page, where this component
  // instance is reused rather than remounted).
  useEffect(() => {
    setText(initialNote);
    setOpen(initialNote.trim().length > 0);
    setStatus("idle");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionId]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function handleChange(value: string) {
    setText(value);
    setStatus("saving");
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      const result = await upsertNote(questionId, value);
      setStatus(result.error ? "error" : "saved");
    }, SAVE_DELAY_MS);
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`text-sm font-medium transition ${
          text.trim() ? "text-primary-700" : "text-slate-400 hover:text-slate-600"
        }`}
      >
        {open ? "Hide note" : text.trim() ? "📝 Edit note" : "📝 Add note"}
      </button>

      {open && (
        <div className="mt-2">
          <textarea
            value={text}
            onChange={(e) => handleChange(e.target.value)}
            rows={3}
            placeholder="Write a personal note about this question..."
            className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-600 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            {status === "saving" && "Saving..."}
            {status === "saved" && "Saved"}
            {status === "error" && (
              <span className="text-red-500 dark:text-red-400">Couldn&rsquo;t save — check your connection.</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
