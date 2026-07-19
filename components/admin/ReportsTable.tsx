"use client";

import { useState } from "react";
import { reopenReport, resolveReport } from "@/app/reports/actions";

export interface ReportRow {
  id: string;
  message: string;
  status: "open" | "resolved";
  created_at: string;
  questionId: string;
  questionStem: string;
  reporterName: string;
}

type StatusFilter = "all" | "open" | "resolved";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ReportsTable({ initialReports }: { initialReports: ReportRow[] }) {
  const [reports, setReports] = useState<ReportRow[]>(initialReports);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("open");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered =
    statusFilter === "all" ? reports : reports.filter((r) => r.status === statusFilter);

  async function handleToggleStatus(report: ReportRow) {
    const nextStatus = report.status === "open" ? "resolved" : "open";
    setError(null);
    setBusyId(report.id);

    // Optimistic update — flip it immediately, roll back if the server call fails.
    setReports((prev) =>
      prev.map((r) => (r.id === report.id ? { ...r, status: nextStatus } : r))
    );

    const result =
      nextStatus === "resolved" ? await resolveReport(report.id) : await reopenReport(report.id);

    setBusyId(null);

    if (result.error) {
      setError(result.error);
      setReports((prev) =>
        prev.map((r) => (r.id === report.id ? { ...r, status: report.status } : r))
      );
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <label htmlFor="report-status-filter" className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Status
        </label>
        <select
          id="report-status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-600 dark:text-slate-100"
        >
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
          <option value="all">All</option>
        </select>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">{error}</p>
      )}

      {filtered.length === 0 ? (
        <p className="mt-8 text-sm text-slate-500 dark:text-slate-400">No reports match this filter.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Question
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Reported by
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Message
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Date
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white dark:bg-slate-800">
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td className="max-w-[16rem] px-4 py-3 text-sm">
                    <a
                      href={`/admin/questions/${r.questionId}/edit`}
                      className="line-clamp-2 font-medium text-primary-700 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
                    >
                      {r.questionStem || "(question)"}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{r.reporterName}</td>
                  <td className="max-w-xs px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                    <p className="whitespace-pre-wrap">{r.message}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        r.status === "open"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-primary-50 text-primary-700"
                      }`}
                    >
                      {r.status === "open" ? "Open" : "Resolved"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                    {formatDate(r.created_at)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(r)}
                      disabled={busyId === r.id}
                      className="text-sm font-medium text-primary-700 hover:text-primary-800 disabled:cursor-not-allowed disabled:opacity-60 dark:text-primary-400 dark:hover:text-primary-300"
                    >
                      {busyId === r.id
                        ? "..."
                        : r.status === "open"
                          ? "Mark resolved"
                          : "Reopen"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
