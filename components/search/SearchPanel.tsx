"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { searchQuestions, startQuizWithQuestion, type SearchResultRow } from "@/app/search/actions";
import type { CatalogLookup } from "@/types/models";

export default function SearchPanel({ catalog }: { catalog: CatalogLookup }) {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [results, setResults] = useState<SearchResultRow[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  function topicIdsForSubject(id: string): string[] {
    if (!id) return [];
    const systemIds = catalog.systems.filter((s) => s.subject_id === id).map((s) => s.id);
    return catalog.topics.filter((t) => systemIds.includes(t.system_id)).map((t) => t.id);
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    setError(null);
    setHasSearched(true);

    const result = await searchQuestions(query, topicIdsForSubject(subjectId));
    setSearching(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    setResults(result.results ?? []);
  }

  async function handlePractice(questionId: string) {
    setStartingId(questionId);
    setError(null);
    const result = await startQuizWithQuestion(questionId);
    setStartingId(null);

    if (result.error) {
      setError(result.error);
      return;
    }
    router.push(`/quiz/${result.quizId}`);
  }

  return (
    <div>
      <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search question text and explanations..."
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        <select
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:w-56"
        >
          <option value="">All subjects</option>
          {catalog.subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={searching || !query.trim()}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {searching ? "Searching..." : "Search"}
        </button>
      </form>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {hasSearched && !searching && results && (
        <p className="mt-4 text-sm text-slate-500">
          {results.length} result{results.length === 1 ? "" : "s"}
        </p>
      )}

      {results && results.length > 0 && (
        <div className="mt-4 space-y-3">
          {results.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-slate-200 bg-white p-4 sm:flex sm:items-start sm:justify-between sm:gap-4"
            >
              <div className="min-w-0">
                <p className="text-sm text-slate-800">{r.stem}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {r.subjectName} › {r.systemName} › {r.topicName}
                  <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 capitalize">
                    {r.difficulty}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => handlePractice(r.id)}
                disabled={startingId === r.id}
                className="mt-3 flex-shrink-0 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:mt-0"
              >
                {startingId === r.id ? "Starting..." : "Practice this question"}
              </button>
            </div>
          ))}
        </div>
      )}

      {hasSearched && !searching && results && results.length === 0 && (
        <p className="mt-8 text-sm text-slate-500">
          No questions matched &ldquo;{query}&rdquo;. Try different terms or clear the subject filter.
        </p>
      )}
    </div>
  );
}
