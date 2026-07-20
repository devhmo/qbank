"use client";

import { useEffect, useRef } from "react";
import type { CatalogLookup } from "@/types/models";

function TriStateCheckbox({
  checked,
  indeterminate,
  onChange,
  label,
  bold,
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  bold?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <label className="flex cursor-pointer items-center gap-2 py-1">
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300 bg-white text-primary-600 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-800 dark:text-primary-400"
      />
      <span className={`text-sm ${bold ? "font-medium text-slate-900 dark:text-slate-100" : "text-slate-700 dark:text-slate-300"}`}>
        {label}
      </span>
    </label>
  );
}

export default function CatalogTreeSelect({
  catalog,
  selectedTopicIds,
  onChange,
}: {
  catalog: CatalogLookup;
  selectedTopicIds: Set<string>;
  onChange: (topicIds: Set<string>) => void;
}) {
  function topicIdsUnder(systemIds: string[]): string[] {
    return catalog.topics
      .filter((t) => systemIds.includes(t.system_id))
      .map((t) => t.id);
  }

  function setMany(ids: string[], checked: boolean) {
    const next = new Set(selectedTopicIds);
    ids.forEach((id) => (checked ? next.add(id) : next.delete(id)));
    onChange(next);
  }

  if (catalog.subjects.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        No subjects yet — ask an admin to set up the catalog first.
      </p>
    );
  }

  return (
    <div className="max-h-72 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-3 dark:border-slate-700">
      {catalog.subjects.map((subject) => {
        const systems = catalog.systems.filter((s) => s.subject_id === subject.id);
        const subjectTopicIds = topicIdsUnder(systems.map((s) => s.id));
        const subjectSelectedCount = subjectTopicIds.filter((id) =>
          selectedTopicIds.has(id)
        ).length;

        return (
          <details key={subject.id} open className="border-b border-slate-100 pb-1 last:border-0 dark:border-slate-800">
            <summary className="flex cursor-pointer list-none items-center gap-2 marker:content-none">
              <TriStateCheckbox
                checked={subjectTopicIds.length > 0 && subjectSelectedCount === subjectTopicIds.length}
                indeterminate={subjectSelectedCount > 0 && subjectSelectedCount < subjectTopicIds.length}
                onChange={(checked) => setMany(subjectTopicIds, checked)}
                label={subject.name}
                bold
              />
            </summary>

            <div className="ml-6 mt-1 space-y-1">
              {systems.map((system) => {
                const systemTopics = catalog.topics.filter((t) => t.system_id === system.id);
                const systemTopicIds = systemTopics.map((t) => t.id);
                const systemSelectedCount = systemTopicIds.filter((id) =>
                  selectedTopicIds.has(id)
                ).length;

                return (
                  <div key={system.id}>
                    <TriStateCheckbox
                      checked={systemTopicIds.length > 0 && systemSelectedCount === systemTopicIds.length}
                      indeterminate={systemSelectedCount > 0 && systemSelectedCount < systemTopicIds.length}
                      onChange={(checked) => setMany(systemTopicIds, checked)}
                      label={system.name}
                    />
                    <div className="ml-6 space-y-0.5">
                      {systemTopics.map((topic) => (
                        <label
                          key={topic.id}
                          className="flex cursor-pointer items-center gap-2 py-0.5"
                        >
                          <input
                            type="checkbox"
                            checked={selectedTopicIds.has(topic.id)}
                            onChange={(e) => setMany([topic.id], e.target.checked)}
                            className="h-3.5 w-3.5 rounded border-slate-300 bg-white text-primary-600 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-800 dark:text-primary-400"
                          />
                          <span className="text-sm text-slate-600 dark:text-slate-400">{topic.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </details>
        );
      })}
    </div>
  );
}
