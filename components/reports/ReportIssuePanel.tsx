"use client";

import { useState } from "react";
import { CircleCheck } from "lucide-react";
import { submitQuestionReport } from "@/app/reports/actions";

export default function ReportIssuePanel({ questionId }: { questionId: string }) {
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
    return (
      <p className="flex items-center gap-1.5 text-sm text-primary-700 dark:text-primary-400">
        <CircleCheck className="h-4 w-4" />
        Report submitted — thank you.
      </p>
    );
  }

  return (
    <div className="w-full">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        autoFocus
        placeholder="What's wrong with this question?"
        className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
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
  );
}
