"use client";

import { useState } from "react";
import { submitQuestionReport } from "@/app/reports/actions";

export default function ReportIssueButton({ questionId }: { questionId: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setStatus("saving");
    const result = await submitQuestionReport(questionId, message);

    if (result.error) {
      setStatus("error");
      setError(result.error);
      return;
    }

    setStatus("sent");
  }

  if (status === "sent") {
    return <p className="text-sm text-primary-700 dark:text-primary-400">✓ Report submitted — thank you.</p>;
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-sm font-medium text-slate-400 transition hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-400"
      >
        {open ? "Cancel report" : "🚩 Report an error"}
      </button>

      {open && (
        <div className="mt-2 w-64">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="What's wrong with this question?"
            className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-600 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
          {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={status === "saving"}
            className="mt-2 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "saving" ? "Submitting..." : "Submit report"}
          </button>
        </div>
      )}
    </div>
  );
}
