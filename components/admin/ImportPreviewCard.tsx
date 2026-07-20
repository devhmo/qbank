"use client";

import { useState } from "react";
import CatalogCascadeSelect from "@/components/admin/CatalogCascadeSelect";
import ChoiceEditorList from "@/components/admin/ChoiceEditorList";
import { validateQuestionInput } from "@/lib/validateQuestion";
import type { CatalogLookup, DifficultyLevel, ParsedQuestion } from "@/types/models";

const inputClasses =
  "block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500";

export default function ImportPreviewCard({
  question,
  index,
  catalog,
  onUpdate,
  onRemove,
}: {
  question: ParsedQuestion;
  index: number;
  catalog: CatalogLookup;
  onUpdate: (key: string, patch: Partial<ParsedQuestion>) => void;
  onRemove: (key: string) => void;
}) {
  const initialTopic = catalog.topics.find((t) => t.id === question.topic_id);
  const initialSystem = initialTopic
    ? catalog.systems.find((s) => s.id === initialTopic.system_id)
    : undefined;

  const [expanded, setExpanded] = useState(question.warnings.length > 0);
  const [subjectId, setSubjectId] = useState(initialSystem?.subject_id ?? "");
  const [systemId, setSystemId] = useState(initialSystem?.id ?? "");

  const validationError = validateQuestionInput(question);
  const isValid = !validationError;

  return (
    <div
      className={`rounded-xl border bg-white dark:bg-slate-800 ${
        isValid ? "border-slate-200 dark:border-slate-700" : "border-amber-300 dark:border-amber-700"
      }`}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start gap-3 px-4 py-3 text-left"
      >
        <span
          className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${
            isValid ? "bg-primary-500" : "bg-amber-500"
          }`}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
            {index + 1}. {question.stem || "(empty stem)"}
          </p>
          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
            {question.subjectName || "Subject?"} ›{" "}
            {question.systemName || "System?"} › {question.topicName || "Topic?"}
            {!isValid && (
              <span className="ml-2 font-medium text-amber-600 dark:text-amber-400">
                {validationError}
              </span>
            )}
          </p>
        </div>
        <span className="flex-shrink-0 text-xs font-medium text-slate-400 dark:text-slate-500">
          {expanded ? "Collapse" : "Edit"}
        </span>
      </button>

      {expanded && (
        <div className="space-y-4 border-t border-slate-200 px-4 py-4 dark:border-slate-700">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Stem
            </label>
            <textarea
              rows={3}
              value={question.stem}
              onChange={(e) => onUpdate(question.key, { stem: e.target.value })}
              className={`mt-1 ${inputClasses}`}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Location
            </label>
            <div className="mt-1">
              <CatalogCascadeSelect
                catalog={catalog}
                subjectId={subjectId}
                systemId={systemId}
                topicId={question.topic_id}
                onChange={(s, sy, t) => {
                  setSubjectId(s);
                  setSystemId(sy);
                  onUpdate(question.key, { topic_id: t });
                }}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Difficulty
              </label>
              <select
                value={question.difficulty}
                onChange={(e) =>
                  onUpdate(question.key, {
                    difficulty: e.target.value as DifficultyLevel,
                  })
                }
                className={`mt-1 ${inputClasses}`}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={question.high_yield}
                  onChange={(e) =>
                    onUpdate(question.key, { high_yield: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-slate-300 bg-white text-primary-600 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-800 dark:text-primary-400"
                />
                High yield
              </label>
            </div>
          </div>

          <ChoiceEditorList
            initialChoices={question.choices}
            onChange={(choices) => onUpdate(question.key, { choices })}
            compact
          />

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Source{" "}
              <span className="font-normal text-slate-400 dark:text-slate-500">(optional)</span>
            </label>
            <input
              type="text"
              value={question.source}
              onChange={(e) =>
                onUpdate(question.key, { source: e.target.value })
              }
              className={`mt-1 ${inputClasses}`}
            />
          </div>

          <div className="flex justify-end border-t border-slate-100 pt-3 dark:border-slate-800">
            <button
              type="button"
              onClick={() => onRemove(question.key)}
              className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-400"
            >
              Remove from import
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
