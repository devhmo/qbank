"use client";

import { useMemo } from "react";
import type { CatalogLookup } from "@/types/models";

const inputClasses =
  "block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500";

export default function CatalogCascadeSelect({
  catalog,
  subjectId,
  systemId,
  topicId,
  onChange,
}: {
  catalog: CatalogLookup;
  subjectId: string;
  systemId: string;
  topicId: string;
  onChange: (subjectId: string, systemId: string, topicId: string) => void;
}) {
  const filteredSystems = useMemo(
    () => catalog.systems.filter((s) => s.subject_id === subjectId),
    [catalog.systems, subjectId]
  );
  const filteredTopics = useMemo(
    () => catalog.topics.filter((t) => t.system_id === systemId),
    [catalog.topics, systemId]
  );

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <select
        value={subjectId}
        onChange={(e) => onChange(e.target.value, "", "")}
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
        onChange={(e) => onChange(subjectId, e.target.value, "")}
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
        onChange={(e) => onChange(subjectId, systemId, e.target.value)}
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
  );
}
