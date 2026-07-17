"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ImageUploadField from "@/components/admin/ImageUploadField";
import CatalogCascadeSelect from "@/components/admin/CatalogCascadeSelect";
import ChoiceEditorList from "@/components/admin/ChoiceEditorList";
import { createQuestion, updateQuestion } from "@/app/admin/questions/actions";
import { validateQuestionInput } from "@/lib/validateQuestion";
import type {
  Choice,
  DifficultyLevel,
  QuestionFormInput,
  QuestionStatus,
  Subject,
  System,
  Topic,
} from "@/types/models";

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
  const [choices, setChoices] = useState<Choice[]>(initial?.choices ?? []);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<QuestionStatus | null>(null);

  const missingCatalogEntries =
    !catalog.subjects.length ||
    (subjectId &&
      !catalog.systems.some((s) => s.subject_id === subjectId)) ||
    (systemId && !catalog.topics.some((t) => t.system_id === systemId));

  async function handleSave(status: QuestionStatus) {
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

    const validationError = validateQuestionInput(input);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSaving(status);

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
        <div className="mt-1">
          <CatalogCascadeSelect
            catalog={catalog}
            subjectId={subjectId}
            systemId={systemId}
            topicId={topicId}
            onChange={(s, sy, t) => {
              setSubjectId(s);
              setSystemId(sy);
              setTopicId(t);
            }}
          />
        </div>
        {missingCatalogEntries && (
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

      <ChoiceEditorList
        initialChoices={initial?.choices ?? []}
        onChange={setChoices}
      />

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
