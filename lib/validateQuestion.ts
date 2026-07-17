import type { QuestionFormInput } from "@/types/models";

// The single source of truth for "is this question complete enough to
// save". Used by the single-question create/update actions and by bulk
// import, both client-side (for instant feedback) and server-side (the
// real gate, since client checks can be bypassed).
export function validateQuestionInput(input: QuestionFormInput): string | null {
  if (!input.stem.trim()) {
    return "Question stem is required.";
  }
  if (!input.topic_id) {
    return "Choose a subject, system, and topic.";
  }
  if (input.choices.length < 2) {
    return "Add at least two choices.";
  }
  if (input.choices.some((c) => !c.text.trim())) {
    return "Every choice needs text.";
  }
  if (!input.choices.some((c) => c.is_correct)) {
    return "Select at least one correct choice.";
  }
  return null;
}
