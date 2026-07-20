"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  bulkDeleteQuestions,
  bulkPublishQuestions,
  deleteQuestion,
} from "@/app/admin/questions/actions";
import type { QuestionListRow, QuestionStatus } from "@/types/models";

type StatusFilter = "all" | QuestionStatus;

function StatusBadge({ status }: { status: string }) {
  const isPublished = status === "published";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isPublished
          ? "bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
          : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
      }`}
    >
      {isPublished ? "Published" : "Draft"}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function SelectAllCheckbox({
  checked,
  indeterminate,
  onChange,
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange: (checked: boolean) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="h-4 w-4 rounded border-slate-300 bg-white text-primary-600 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-800 dark:text-primary-400"
      aria-label="Select all questions"
    />
  );
}

export default function QuestionsTable({
  questions,
}: {
  questions: QuestionListRow[];
}) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [rowDeleting, setRowDeleting] = useState<string | null>(null);
  const [bulkAction, setBulkAction] = useState<"publish" | "delete" | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const filteredQuestions = useMemo(
    () =>
      statusFilter === "all"
        ? questions
        : questions.filter((q) => q.status === statusFilter),
    [questions, statusFilter]
  );

  // Drop any selections that fall outside the current filter or no longer
  // exist (e.g. after a refresh), so the action bar never references stale ids.
  useEffect(() => {
    const visibleIds = new Set(filteredQuestions.map((q) => q.id));
    setSelectedIds((prev) => {
      const next = new Set([...prev].filter((id) => visibleIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [filteredQuestions]);

  const allSelected =
    filteredQuestions.length > 0 &&
    filteredQuestions.every((q) => selectedIds.has(q.id));
  const someSelected = selectedIds.size > 0 && !allSelected;

  function toggleSelectAll(checked: boolean) {
    setSelectedIds(
      checked ? new Set(filteredQuestions.map((q) => q.id)) : new Set()
    );
  }

  function toggleRow(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function handleRowDelete(id: string) {
    const confirmed = window.confirm(
      "Delete this question? This also permanently deletes its choices, and removes it from any quiz history, bookmarks, and notes that reference it. This can't be undone."
    );
    if (!confirmed) return;

    setRowDeleting(id);
    setError(null);
    const result = await deleteQuestion(id);
    setRowDeleting(null);

    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function handleBulkPublish() {
    setBulkAction("publish");
    setError(null);
    const result = await bulkPublishQuestions([...selectedIds]);
    setBulkAction(null);

    if (result.error) {
      setError(result.error);
      return;
    }
    setSelectedIds(new Set());
    router.refresh();
  }

  async function handleBulkDelete() {
    const count = selectedIds.size;
    const confirmed = window.confirm(
      `Delete ${count} question${count === 1 ? "" : "s"}? This also permanently deletes their choices, and removes them from any quiz history, bookmarks, and notes that reference them. This can't be undone.`
    );
    if (!confirmed) return;

    setBulkAction("delete");
    setError(null);
    const result = await bulkDeleteQuestions([...selectedIds]);
    setBulkAction(null);

    if (result.error) {
      setError(result.error);
      return;
    }
    setSelectedIds(new Set());
    router.refresh();
  }

  return (
    <div>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="status-filter" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Status
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="all">All</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 dark:bg-primary-900/40">
            <span className="text-sm font-medium text-primary-800 dark:text-primary-300">
              {selectedIds.size} selected
            </span>
            <button
              type="button"
              onClick={handleBulkPublish}
              disabled={bulkAction !== null}
              className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {bulkAction === "publish" ? "Publishing..." : "Publish Selected"}
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={bulkAction !== null}
              className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-700 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-900/30"
            >
              {bulkAction === "delete" ? "Deleting..." : "Delete Selected"}
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
          {error}
        </p>
      )}

      {filteredQuestions.length === 0 ? (
        <p className="mt-8 text-sm text-slate-500 dark:text-slate-400">
          No questions match this filter.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3">
                  <SelectAllCheckbox
                    checked={allSelected}
                    indeterminate={someSelected}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Stem
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Subject
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
            <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-800">
              {filteredQuestions.map((q) => (
                <tr key={q.id} className={selectedIds.has(q.id) ? "bg-primary-50/40 dark:bg-primary-900/20" : ""}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(q.id)}
                      onChange={(e) => toggleRow(q.id, e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 bg-white text-primary-600 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-800 dark:text-primary-400"
                      aria-label={`Select question: ${q.stem}`}
                    />
                  </td>
                  <td className="max-w-sm px-4 py-3 text-sm text-slate-900 dark:text-slate-100">
                    <p className="truncate">{q.stem}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                    {q.topics?.systems?.subjects?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={q.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                    {formatDate(q.created_at)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center justify-end gap-4">
                      <a
                        href={`/admin/questions/${q.id}/edit`}
                        className="text-sm font-medium text-primary-700 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
                      >
                        Edit
                      </a>
                      <button
                        type="button"
                        onClick={() => handleRowDelete(q.id)}
                        disabled={rowDeleting === q.id}
                        className="text-sm font-medium text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-400 dark:hover:text-red-400"
                      >
                        {rowDeleting === q.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
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
