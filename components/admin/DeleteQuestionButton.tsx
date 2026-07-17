"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteQuestion } from "@/app/admin/questions/actions";

export default function DeleteQuestionButton({ id }: { id: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    const confirmed = window.confirm(
      "Delete this question? This also permanently deletes its choices, and removes it from any quiz history, bookmarks, and notes that reference it. This can't be undone."
    );
    if (!confirmed) return;

    setDeleting(true);
    setError(null);

    const result = await deleteQuestion(id);

    setDeleting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    router.refresh();
  }

  return (
    <div className="text-right">
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="text-sm font-medium text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {deleting ? "Deleting..." : "Delete"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
