"use client";

import { useEffect, useRef, useState } from "react";
import { Bookmark, CircleAlert, EllipsisVertical, Flag, Highlighter, NotebookPen } from "lucide-react";
import NoteEditor from "@/components/notes/NoteEditor";
import ReportIssuePanel from "@/components/reports/ReportIssuePanel";

type Panel = "note" | "report" | null;

function IconButton({
  icon: Icon,
  active,
  label,
  onClick,
}: {
  icon: typeof Bookmark;
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border transition ${
        active
          ? "border-primary-400 bg-primary-50 text-primary-700 dark:border-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
          : "border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
      }`}
    >
      <Icon className="h-4 w-4" fill={active ? "currentColor" : "none"} />
    </button>
  );
}

function MenuItem({
  icon: Icon,
  label,
  description,
  active,
  onClick,
}: {
  icon: typeof Bookmark;
  label: string;
  description?: string;
  active?: boolean;
  onClick: () => void;
}) {
  const isToggle = active !== undefined;
  return (
    <button
      type="button"
      role={isToggle ? "menuitemcheckbox" : "menuitem"}
      aria-checked={isToggle ? active : undefined}
      onClick={onClick}
      className={`flex w-full items-start gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition hover:bg-slate-100 dark:hover:bg-slate-700 ${
        active ? "text-primary-700 dark:text-primary-400" : "text-slate-700 dark:text-slate-200"
      }`}
    >
      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" fill={active ? "currentColor" : "none"} />
      <span>
        <span className="block font-medium">{label}</span>
        {description && (
          <span className="block text-xs font-normal text-slate-400 dark:text-slate-500">{description}</span>
        )}
      </span>
    </button>
  );
}

export default function QuestionActionsRow({
  questionId,
  note,
  onNoteChange,
  isBookmarked,
  onToggleBookmark,
  isMarked,
  onToggleMark,
  highlightEnabled,
  onToggleHighlight,
}: {
  questionId: string;
  note: string;
  onNoteChange: (text: string) => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  isMarked: boolean;
  onToggleMark: () => void;
  highlightEnabled: boolean;
  onToggleHighlight: () => void;
}) {
  const [activePanel, setActivePanel] = useState<Panel>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // Closing the note/report panel and the More menu when navigating to a
  // different question keeps the row from showing stale, question-specific
  // state (an open note draft, a report form) for the newly shown question.
  useEffect(() => {
    setActivePanel(null);
    setMoreOpen(false);
  }, [questionId]);

  useEffect(() => {
    if (!moreOpen) return;
    function handlePointerDown(e: MouseEvent | TouchEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMoreOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [moreOpen]);

  const hasNote = note.trim().length > 0;

  return (
    <div className="mt-3">
      <div className="flex items-center justify-end gap-1.5">
        <IconButton
          icon={NotebookPen}
          active={activePanel === "note" || hasNote}
          label={hasNote ? "Edit note" : "Add note"}
          onClick={() => setActivePanel((p) => (p === "note" ? null : "note"))}
        />
        <IconButton
          icon={Flag}
          active={isMarked}
          label={isMarked ? "Marked for review" : "Mark for review"}
          onClick={onToggleMark}
        />

        <div className="relative" ref={moreRef}>
          <IconButton
            icon={EllipsisVertical}
            active={moreOpen}
            label="More actions"
            onClick={() => setMoreOpen((v) => !v)}
          />

          {moreOpen && (
            <div
              role="menu"
              aria-label="More actions"
              className="absolute right-0 top-full z-20 mt-1.5 w-56 rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-700 dark:bg-slate-800"
            >
              <MenuItem
                icon={Bookmark}
                label={isBookmarked ? "Bookmarked" : "Bookmark"}
                active={isBookmarked}
                onClick={() => {
                  onToggleBookmark();
                  setMoreOpen(false);
                }}
              />
              <MenuItem
                icon={Highlighter}
                label={highlightEnabled ? "Highlighting on" : "Highlight text"}
                description="Select text to highlight it. Tap a highlight to remove it."
                active={highlightEnabled}
                onClick={() => {
                  onToggleHighlight();
                  setMoreOpen(false);
                }}
              />
              <MenuItem
                icon={CircleAlert}
                label="Report error"
                onClick={() => {
                  setActivePanel("report");
                  setMoreOpen(false);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {activePanel === "note" && (
        <div className="mt-2">
          <NoteEditor questionId={questionId} initialNote={note} onNoteChange={onNoteChange} />
        </div>
      )}
      {activePanel === "report" && (
        <div className="mt-2">
          <ReportIssuePanel questionId={questionId} />
        </div>
      )}
    </div>
  );
}
