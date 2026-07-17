"use client";

import { useMemo, useState } from "react";
import ImportPreviewCard from "@/components/admin/ImportPreviewCard";
import { bulkCreateQuestions } from "@/app/admin/import/actions";
import { validateQuestionInput } from "@/lib/validateQuestion";
import type { CatalogLookup, ParsedQuestion, QuestionFormInput } from "@/types/models";

export default function ImportPreviewList({
  initialQuestions,
  catalog,
  onStartOver,
}: {
  initialQuestions: ParsedQuestion[];
  catalog: CatalogLookup;
  onStartOver: () => void;
}) {
  const [questions, setQuestions] = useState<ParsedQuestion[]>(initialQuestions);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState<number | null>(null);

  function handleUpdate(key: string, patch: Partial<ParsedQuestion>) {
    setQuestions((qs) => qs.map((q) => (q.key === key ? { ...q, ...patch } : q)));
  }

  function handleRemove(key: string) {
    setQuestions((qs) => qs.filter((q) => q.key !== key));
  }

  const validQuestions = useMemo(
    () => questions.filter((q) => !validateQuestionInput(q)),
    [questions]
  );
  const invalidCount = questions.length - validQuestions.length;

  async function handleImport() {
    setSaving(true);
    setError(null);

    const result = await bulkCreateQuestions(validQuestions as QuestionFormInput[]);

    setSaving(false);

    if (result.error) {
      setError(
        `Saved ${result.created} question${result.created === 1 ? "" : "s"} before running into a problem: ${result.error}. The ones already saved are safe as drafts — fix the issue above and re-import the rest.`
      );
      return;
    }

    setImportedCount(result.created);
  }

  if (importedCount !== null) {
    return (
      <div className="rounded-xl border border-primary-200 bg-primary-50 p-6 text-center">
        <p className="text-lg font-semibold text-primary-800">
          Imported {importedCount} question{importedCount === 1 ? "" : "s"} as
          drafts.
        </p>
        <p className="mt-1 text-sm text-primary-700">
          Review and publish them from the Questions list.
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <a
            href="/admin/questions"
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700"
          >
            Go to Questions
          </a>
          <button
            type="button"
            onClick={onStartOver}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Import more
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <p className="text-sm text-slate-600">
          <span className="font-medium text-slate-900">{questions.length}</span>{" "}
          question{questions.length === 1 ? "" : "s"} parsed —{" "}
          <span className="font-medium text-primary-700">
            {validQuestions.length} ready
          </span>
          {invalidCount > 0 && (
            <>
              ,{" "}
              <span className="font-medium text-amber-600">
                {invalidCount} need attention
              </span>
            </>
          )}
          .
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onStartOver}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Start over
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={saving || validQuestions.length === 0}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving
              ? "Importing..."
              : `Import ${validQuestions.length} Question${validQuestions.length === 1 ? "" : "s"} as Drafts`}
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-4 space-y-3">
        {questions.map((q, index) => (
          <ImportPreviewCard
            key={q.key}
            question={q}
            index={index}
            catalog={catalog}
            onUpdate={handleUpdate}
            onRemove={handleRemove}
          />
        ))}
      </div>
    </div>
  );
}
