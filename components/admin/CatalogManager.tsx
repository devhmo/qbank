"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Subject, System, Topic } from "@/types/models";
import {
  createSubject,
  createSystem,
  createTopic,
  deleteSubject,
  deleteSystem,
  deleteTopic,
  updateSubject,
  updateSystem,
  updateTopic,
} from "@/app/admin/catalog/actions";

interface Item {
  id: string;
  name: string;
}

type ActionResult = { error?: string };

function CatalogColumn({
  title,
  items,
  selectedId,
  onSelect,
  disabled,
  disabledMessage,
  onAdd,
  onRename,
  onDelete,
}: {
  title: string;
  items: Item[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  disabled?: boolean;
  disabledMessage?: string;
  onAdd: (name: string) => Promise<ActionResult>;
  onRename: (id: string, name: string) => Promise<ActionResult>;
  onDelete: (id: string) => Promise<ActionResult>;
}) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setBusy(true);
    setError(null);
    const result = await onAdd(newName.trim());
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setNewName("");
  }

  async function handleRenameSave(id: string) {
    if (!editingName.trim()) return;
    setBusy(true);
    setError(null);
    const result = await onRename(id, editingName.trim());
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      `Delete "${items.find((i) => i.id === id)?.name}"? Anything nested under it must be empty first.`
    );
    if (!confirmed) return;
    setBusy(true);
    setError(null);
    const result = await onDelete(id);
    setBusy(false);
    if (result.error) {
      setError(result.error);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-700">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
      </div>

      {disabled ? (
        <p className="px-4 py-6 text-sm text-slate-400 dark:text-slate-500">{disabledMessage}</p>
      ) : (
        <>
          <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-700">
            {items.length === 0 && (
              <li className="px-4 py-4 text-sm text-slate-400 dark:text-slate-500">None yet.</li>
            )}
            {items.map((item) => (
              <li
                key={item.id}
                className={`flex items-center justify-between gap-2 px-4 py-2.5 ${
                  selectedId === item.id ? "bg-primary-50 dark:bg-primary-900/20" : ""
                }`}
              >
                {editingId === item.id ? (
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      autoFocus
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    />
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleRenameSave(item.id)}
                      className="text-xs font-medium text-primary-700 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => onSelect(item.id)}
                      className={`flex-1 truncate text-left text-sm ${
                        selectedId === item.id
                          ? "font-medium text-primary-800 dark:text-primary-300"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {item.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(item.id);
                        setEditingName(item.name);
                      }}
                      className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleDelete(item.id)}
                      className="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-400"
                    >
                      Delete
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>

          <form
            onSubmit={handleAdd}
            className="flex items-center gap-2 border-t border-slate-200 p-3 dark:border-slate-700"
          >
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={`New ${title.toLowerCase().replace(/s$/, "")}...`}
              className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
            <button
              type="submit"
              disabled={busy}
              className="flex-shrink-0 rounded-md bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-60"
            >
              Add
            </button>
          </form>
        </>
      )}

      {error && (
        <p className="border-t border-slate-200 px-4 py-2 text-xs text-red-600 dark:border-slate-700 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

export default function CatalogManager({
  subjects,
  systems,
  topics,
}: {
  subjects: Subject[];
  systems: System[];
  topics: Topic[];
}) {
  const router = useRouter();
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(
    subjects[0]?.id ?? null
  );
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(
    null
  );

  const filteredSystems = useMemo(
    () => systems.filter((s) => s.subject_id === selectedSubjectId),
    [systems, selectedSubjectId]
  );
  const filteredTopics = useMemo(
    () => topics.filter((t) => t.system_id === selectedSystemId),
    [topics, selectedSystemId]
  );

  async function withRefresh(fn: () => Promise<ActionResult>) {
    const result = await fn();
    if (!result.error) router.refresh();
    return result;
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <CatalogColumn
        title="Subjects"
        items={subjects}
        selectedId={selectedSubjectId}
        onSelect={(id) => {
          setSelectedSubjectId(id);
          setSelectedSystemId(null);
        }}
        onAdd={(name) => withRefresh(() => createSubject(name))}
        onRename={(id, name) => withRefresh(() => updateSubject(id, name))}
        onDelete={(id) => withRefresh(() => deleteSubject(id))}
      />

      <CatalogColumn
        title="Systems"
        items={filteredSystems}
        selectedId={selectedSystemId}
        onSelect={(id) => setSelectedSystemId(id)}
        disabled={!selectedSubjectId}
        disabledMessage="Select a subject first."
        onAdd={(name) =>
          withRefresh(() => createSystem(selectedSubjectId as string, name))
        }
        onRename={(id, name) => withRefresh(() => updateSystem(id, name))}
        onDelete={(id) => withRefresh(() => deleteSystem(id))}
      />

      <CatalogColumn
        title="Topics"
        items={filteredTopics}
        selectedId={null}
        onSelect={() => {}}
        disabled={!selectedSystemId}
        disabledMessage="Select a system first."
        onAdd={(name) =>
          withRefresh(() => createTopic(selectedSystemId as string, name))
        }
        onRename={(id, name) => withRefresh(() => updateTopic(id, name))}
        onDelete={(id) => withRefresh(() => deleteTopic(id))}
      />
    </div>
  );
}
