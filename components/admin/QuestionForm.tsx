"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ImageUploadField from "@/components/admin/ImageUploadField";
import { createQuestion, updateQuestion } from "@/app/admin/questions/actions";
import type {
  Choice,
  DifficultyLevel,
  QuestionFormInput,
  QuestionStatus,
  Subject,
  System,
  Topic,
} from "@/types/models";

interface ChoiceRow extends Choice {
  key: string;
}

function emptyChoice(): ChoiceRow {
  return {
    key: crypto.randomUUID(),
    text: "",
    is_correct: false,
    explanation: "",
    order_index: 0,
  };
}

const inputClasses =
  "block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500";

export default function QuestionForm({
  mode,
  questionId,
  catalog,
  initial,
}: {
  mode: "create" | "edit";
  questionId?: string;
  catalog: { subjects: Subject[]; systems: System[]; topics: Topic[] };
  initial?: QuestionFormInput;
}) {
  const router = useRouter();

  // Work out which subject/system the initial topic belongs to, so the
  // cascading dropdowns start pre-selected correctly when editing.
  const initialTopic = initial
    ? catalog.topics.find((t) => t.id === initial.topic_id)
    : undefined;
  const initialSystem = initialTopic
    ? catalog.systems.find((s) => s.id === initialTopic.system_id)
    : undefined;

  const [stem, setStem] = useState(initial?.stem ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(
    initial?.image_url ?? null
  );
  const [subjectId, setSubjectId] = useState(initialSystem?.subject_id ?? "");
  const [systemId, setSystemId] = useState(initialSystem?.id ?? "");
  const [topicId, setTopicId] = useState(initial?.topic_id ?? "");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(
    initial?.difficulty ?? "medium"
  );
  const [highYield, setHighYield] = useState(initial?.high_yield ?? false);
  const [source, setSource] = useState(initial?.source ?? "");
  const [choices, setChoices] = useState<ChoiceRow[]>(
    initial?.choices && initial.choices.length > 0
      ? initial.choices.map((c) => ({ ...c, key: crypto.randomUUID() }))
      : [emptyChoice(), emptyChoice()]
  );

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<QuestionStatus | null>(null);

  const filteredSystems = useMemo(
    () => catalog.systems.filter((s) => s.subject_id === subjectId),
    [catalog.systems, subjectId]
  );
  const filteredTopics = useMemo(
    () => catalog.topics.filter((t) => t.system_id === systemId),
    [catalog.topics, systemId]
  );

  function handleSubjectChange(id: string) {
    setSubjectId(id);
    setSystemId("");
    setTopicId("");
  }

  function handleSystemChange(id: string) {
    setSystemId(id);
    setTopicId("");
  }

  function updateChoice(key: string, patch: Partial<ChoiceRow>) {
    setChoices((rows) =>
      rows.map((row) => (row.key === key ? { ...row, ...patch } : row))
    );
  }

  function addChoice() {
    setChoices((rows) => [...rows, emptyChoice()]);
  }

  function removeChoice(key: string) {
    setChoices((rows) =>
      rows.length > 2 ? rows.filter((row) => row.key !== key) : rows
    );
  }

  function validateClientSide(): string | null {
    if (!stem.trim()) return "Question stem is required.";
    if (!subjectId || !systemId || !topicId) {
      return "Choose a subject, system, and topic.";
    }
    if (choices.length < 2) return "Add at least two choices.";
    if (choices.some((c) => !c.text.trim())) return "Every choice needs text.";
    if (!choices.some((c) => c.is_correct)) {
      return "Select at least one correct choice.";
    }
    return null;
  }

  async function handleSave(status: QuestionStatus) {
    const validationError = validateClientSide();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSaving(status);

    const input: QuestionFormInput = {
      stem: stem.trim(),
      image_url: imageUrl,
      difficulty,
      high_yield: highYield,
      topic_id: topicId,
      source: source.trim(),
      status,
      choices: choices.map((c, index) => ({
        text: c.text.trim(),
        is_correct: c.is_correct,
        explanation: c.explanation.trim(),
        order_index: index,
      })),
    };

    const result =
      mode === "create"
        ? await createQuestion(input)
        : await updateQuestion(questionId as string, input);

    setSaving(null);

    if (result.error) {
      setError(result.error);
      return;
    }

    router.push("/admin/questions");
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div>
        <label htmlFor="stem" className="block text-sm font-medium text-slate-700">
          Question stem
        </label>
        <textarea
          id="stem"
          rows={6}
          value={stem}
          onChange={(e) => setStem(e.target.value)}
          className={`mt-1 ${inputClasses}`}
          placeholder="Type the full question here. Multiple paragraphs are fine."
        />
      </div>

      <ImageUploadField value={imageUrl} onChange={setImageUrl} />

      <div>
        <p className="block text-sm font-medium text-slate-700">Location</p>
        <div className="mt-1 grid gap-3 sm:grid-cols-3">
          <select
            value={subjectId}
            onChange={(e) => handleSubjectChange(e.target.value)}
            className={inputClasses}
          >
            <option value="">Subject...</option>
            {catalog.subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={systemId}
            onChange={(e) => handleSystemChange(e.target.value)}
            disabled={!subjectId}
            className={`${inputClasses} disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400`}
          >
            <option value="">System...</option>
            {filteredSystems.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
            disabled={!systemId}
            className={`${inputClasses} disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400`}
          >
            <option value="">Topic...</option>
            {filteredTopics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        {(!catalog.subjects.length || (subjectId && !filteredSystems.length) || (systemId && !filteredTopics.length)) && (
          <p className="mt-2 text-sm text-slate-500">
            Need a new subject, system, or topic? Manage them on the{" "}
            <a href="/admin/catalog" className="font-medium text-primary-700 hover:text-primary-800">
              Catalog page
            </a>
            .
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="difficulty" className="block text-sm font-medium text-slate-700">
            Difficulty
          </label>
          <select
            id="difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
            className={`mt-1 ${inputClasses}`}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={highYield}
              onChange={(e) => setHighYield(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            High yield
          </label>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <p className="block text-sm font-medium text-slate-700">Choices</p>
          <button
            type="button"
            onClick={addChoice}
            className="text-sm font-medium text-primary-700 hover:text-primary-800"
          >
            + Add choice
          </button>
        </div>

        <div className="mt-2 space-y-4">
          {choices.map((choice, index) => (
            <div
              key={choice.key}
              className="rounded-lg border border-slate-200 p-4"
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={choice.is_correct}
                  onChange={(e) =>
                    updateChoice(choice.key, { is_correct: e.target.checked })
                  }
                  title="Mark as correct"
                  className="mt-2 h-4 w-4 flex-shrink-0 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={choice.text}
                    onChange={(e) =>
                      updateChoice(choice.key, { text: e.target.value })
                    }
                    placeholder={`Choice ${index + 1}`}
                    className={inputClasses}
                  />
                  <textarea
                    value={choice.explanation}
                    onChange={(e) =>
                      updateChoice(choice.key, { explanation: e.target.value })
                    }
                    rows={2}
                    placeholder="Explanation for this choice (optional)"
                    className={inputClasses}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeChoice(choice.key)}
                  disabled={choices.length <= 2}
                  title={
                    choices.length <= 2
                      ? "At least two choices are required"
                      : "Remove this choice"
                  }
                  className="mt-1 flex-shrink-0 text-sm font-medium text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:text-slate-300"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Check the box next to a choice to mark it correct. At least one is
          required.
        </p>
      </div>

      <div>
        <label htmlFor="source" className="block text-sm font-medium text-slate-700">
          Source / reference{" "}
          <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <input
          id="source"
          type="text"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className={`mt-1 ${inputClasses}`}
          placeholder="e.g. Guyton & Hall, Ch. 29"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3 border-t border-slate-200 pt-6">
        <button
          type="button"
          onClick={() => handleSave("draft")}
          disabled={saving !== null}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving === "draft" ? "Saving..." : "Save as Draft"}
        </button>
        <button
          type="button"
          onClick={() => handleSave("published")}
          disabled={saving !== null}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving === "published" ? "Publishing..." : "Publish Now"}
        </button>
      </div>
    </div>
  );
}
