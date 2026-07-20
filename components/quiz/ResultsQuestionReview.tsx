import Image from "next/image";
import NoteEditor from "@/components/notes/NoteEditor";
import type { QuizChoice } from "@/types/models";

const LETTERS = "ABCDEFGHIJ";

export default function ResultsQuestionReview({
  index,
  questionId,
  stem,
  imageUrl,
  choices,
  selectedChoiceId,
  isCorrect,
  initialNote,
}: {
  index: number;
  questionId: string;
  stem: string;
  imageUrl: string | null;
  choices: QuizChoice[];
  selectedChoiceId: string | null;
  isCorrect: boolean | null;
  initialNote: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Question {index + 1}</p>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            isCorrect === null
              ? "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
              : isCorrect
                ? "bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
                : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          }`}
        >
          {isCorrect === null ? "Not answered" : isCorrect ? "Correct" : "Incorrect"}
        </span>
      </div>

      {imageUrl && (
        <div className="relative mb-4 h-48 w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
          <Image src={imageUrl} alt="Question illustration" fill className="object-contain" />
        </div>
      )}

      <p className="whitespace-pre-wrap text-base leading-relaxed text-slate-800 dark:text-slate-200">{stem}</p>

      <div className="mt-4 space-y-2">
        {choices.map((choice, i) => {
          const isSelected = choice.id === selectedChoiceId;
          const isCorrectChoice = choice.is_correct === true;

          return (
            <div key={choice.id}>
              <div
                className={`flex items-start gap-3 rounded-lg border p-3 ${
                  isCorrectChoice
                    ? "border-primary-400 bg-primary-50 dark:border-primary-600 dark:bg-primary-900/30"
                    : isSelected
                      ? "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/30"
                      : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
                }`}
              >
                <span
                  className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border text-xs font-medium ${
                    isSelected
                      ? "border-slate-500 bg-slate-500 text-white"
                      : "border-slate-300 text-slate-500 dark:border-slate-600 dark:text-slate-400"
                  }`}
                >
                  {LETTERS[i] ?? i + 1}
                </span>
                <span className="text-sm text-slate-800 dark:text-slate-200">
                  {choice.text}
                  {isSelected && <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">(your answer)</span>}
                </span>
              </div>
              {choice.explanation && (
                <p className="mt-1 px-3 text-sm text-slate-600 dark:text-slate-400">{choice.explanation}</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
        <NoteEditor questionId={questionId} initialNote={initialNote} />
      </div>
    </div>
  );
}
