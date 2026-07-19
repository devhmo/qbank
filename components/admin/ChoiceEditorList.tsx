"use client";

import { useEffect, useState } from "react";
import type { Choice } from "@/types/models";

interface ChoiceRow extends Choice {
  uiKey: string;
}

const inputClasses =
  "block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500";

function withKeys(choices: Choice[]): ChoiceRow[] {
  return choices.map((c) => ({ ...c, uiKey: crypto.randomUUID() }));
}

function stripKeys(rows: ChoiceRow[]): Choice[] {
  return rows.map(({ uiKey: _uiKey, ...rest }, index) => ({
    ...rest,
    order_index: index,
  }));
}

function emptyChoice(): Choice {
  return { text: "", is_correct: false, explanation: "", order_index: 0 };
}

export default function ChoiceEditorList({
  initialChoices,
  onChange,
  compact = false,
}: {
  initialChoices: Choice[];
  onChange: (choices: Choice[]) => void;
  compact?: boolean;
}) {
  const [rows, setRows] = useState<ChoiceRow[]>(() =>
    withKeys(
      initialChoices.length > 0
        ? initialChoices
        : [emptyChoice(), emptyChoice()]
    )
  );

  function commit(next: ChoiceRow[]) {
    setRows(next);
    onChange(stripKeys(next));
  }

  // Sync the parent's state with the initial rows on mount — otherwise, if
  // the caller passed an empty array (falling back to two blank choices
  // here) and the admin never edits them, the parent would still think
  // there are zero choices.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => onChange(stripKeys(rows)), []);

  function updateChoice(uiKey: string, patch: Partial<ChoiceRow>) {
    commit(rows.map((row) => (row.uiKey === uiKey ? { ...row, ...patch } : row)));
  }

  function addChoice() {
    commit([...rows, { ...emptyChoice(), uiKey: crypto.randomUUID() }]);
  }

  function removeChoice(uiKey: string) {
    if (rows.length <= 2) return;
    commit(rows.filter((row) => row.uiKey !== uiKey));
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="block text-sm font-medium text-slate-700 dark:text-slate-300">Choices</p>
        <button
          type="button"
          onClick={addChoice}
          className="text-sm font-medium text-primary-700 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
        >
          + Add choice
        </button>
      </div>

      <div className={`mt-2 space-y-${compact ? "3" : "4"}`}>
        {rows.map((choice, index) => (
          <div
            key={choice.uiKey}
            className="rounded-lg border border-slate-200 p-3 dark:border-slate-700"
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={choice.is_correct}
                onChange={(e) =>
                  updateChoice(choice.uiKey, { is_correct: e.target.checked })
                }
                title="Mark as correct"
                className="mt-2 h-4 w-4 flex-shrink-0 rounded border-slate-300 text-primary-600 focus:ring-primary-500 dark:border-slate-600 dark:text-primary-400"
              />
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={choice.text}
                  onChange={(e) =>
                    updateChoice(choice.uiKey, { text: e.target.value })
                  }
                  placeholder={`Choice ${index + 1}`}
                  className={inputClasses}
                />
                {!compact && (
                  <textarea
                    value={choice.explanation}
                    onChange={(e) =>
                      updateChoice(choice.uiKey, { explanation: e.target.value })
                    }
                    rows={2}
                    placeholder="Explanation for this choice (optional)"
                    className={inputClasses}
                  />
                )}
              </div>
              <button
                type="button"
                onClick={() => removeChoice(choice.uiKey)}
                disabled={rows.length <= 2}
                title={
                  rows.length <= 2
                    ? "At least two choices are required"
                    : "Remove this choice"
                }
                className="mt-1 flex-shrink-0 text-sm font-medium text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:text-slate-300 dark:text-red-400 dark:hover:text-red-400"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        Check the box next to a choice to mark it correct. At least one is
        required.
      </p>
    </div>
  );
}
