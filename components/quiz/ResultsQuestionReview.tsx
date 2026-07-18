import Image from "next/image";
import type { QuizChoice } from "@/types/models";

const LETTERS = "ABCDEFGHIJ";

export default function ResultsQuestionReview({
  index,
  stem,
  imageUrl,
  choices,
  selectedChoiceId,
  isCorrect,
}: {
  index: number;
  stem: string;
  imageUrl: string | null;
  choices: QuizChoice[];
  selectedChoiceId: string | null;
  isCorrect: boolean | null;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">Question {index + 1}</p>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            isCorrect === null
              ? "bg-slate-100 text-slate-600"
              : isCorrect
                ? "bg-primary-50 text-primary-700"
                : "bg-red-50 text-red-700"
          }`}
        >
          {isCorrect === null ? "Not answered" : isCorrect ? "Correct" : "Incorrect"}
        </span>
      </div>

      {imageUrl && (
        <div className="relative mb-4 h-48 w-full overflow-hidden rounded-lg border border-slate-200">
          <Image src={imageUrl} alt="Question illustration" fill className="object-contain" />
        </div>
      )}

      <p className="whitespace-pre-wrap text-base leading-relaxed text-slate-800">{stem}</p>

      <div className="mt-4 space-y-2">
        {choices.map((choice, i) => {
          const isSelected = choice.id === selectedChoiceId;
          const isCorrectChoice = choice.is_correct === true;

          return (
            <div key={choice.id}>
              <div
                className={`flex items-start gap-3 rounded-lg border p-3 ${
                  isCorrectChoice
                    ? "border-primary-400 bg-primary-50"
                    : isSelected
                      ? "border-red-300 bg-red-50"
                      : "border-slate-200 bg-white"
                }`}
              >
                <span
                  className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border text-xs font-medium ${
                    isSelected
                      ? "border-slate-500 bg-slate-500 text-white"
                      : "border-slate-300 text-slate-500"
                  }`}
                >
                  {LETTERS[i] ?? i + 1}
                </span>
                <span className="text-sm text-slate-800">
                  {choice.text}
                  {isSelected && <span className="ml-2 text-xs text-slate-500">(your answer)</span>}
                </span>
              </div>
              {choice.explanation && (
                <p className="mt-1 px-3 text-sm text-slate-600">{choice.explanation}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
