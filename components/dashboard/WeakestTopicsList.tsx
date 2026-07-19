import type { SubjectBreakdown } from "@/types/models";

export default function WeakestTopicsList({
  topics,
}: {
  topics: (SubjectBreakdown & { pct: number })[];
}) {
  if (topics.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Answer a few more questions in each topic to see this.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {topics.map((t) => (
        <div key={t.subjectName}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-slate-700 dark:text-slate-300">{t.subjectName}</span>
            <span className="text-slate-500 dark:text-slate-400">
              {t.correct}/{t.total} ({t.pct}%)
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
            <div
              className="h-full rounded-full bg-amber-500"
              style={{ width: `${t.pct}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
