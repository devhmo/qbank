import type { QuizChoice, QuizMode } from "@/types/models";

export interface RevealState {
  revealed: Set<string>;
  expanded: Set<string>;
}

export interface ClickResult {
  state: RevealState;
  shouldAnswer: boolean;
}

// Reconstructs where a returning visit to this question should start from,
// based only on the persisted grading fields (selected_choice_id /
// is_correct via the choice's own is_correct) — not a full history of
// every choice explored. That's an intentional scope boundary: the graded
// answer always survives navigating away and back or a reload; which
// *other* wrong choices were also explored along the way does not.
export function buildInitialState(
  choices: QuizChoice[],
  selectedChoiceId: string | null,
  mode: QuizMode
): RevealState {
  const revealed = new Set<string>();
  const expanded = new Set<string>();

  if (mode === "tutor" && selectedChoiceId) {
    revealed.add(selectedChoiceId);
    expanded.add(selectedChoiceId);

    const selectedChoice = choices.find((c) => c.id === selectedChoiceId);
    if (selectedChoice?.is_correct) {
      choices.forEach((c) => revealed.add(c.id));
    }
  }

  return { revealed, expanded };
}

// One click on `choiceId` in Tutor mode. Returns the next state plus
// whether this click should be persisted as the graded answer (true only
// for the very first choice ever clicked on this question).
export function applyChoiceClick(
  state: RevealState,
  choices: QuizChoice[],
  choiceId: string,
  selectedChoiceId: string | null
): ClickResult {
  if (state.revealed.has(choiceId)) {
    // Already revealed: toggle its explanation only. Color is permanent.
    const nextExpanded = new Set(state.expanded);
    if (nextExpanded.has(choiceId)) nextExpanded.delete(choiceId);
    else nextExpanded.add(choiceId);
    return { state: { revealed: state.revealed, expanded: nextExpanded }, shouldAnswer: false };
  }

  const clicked = choices.find((c) => c.id === choiceId);
  const isFirstEverClick = selectedChoiceId === null;

  const nextRevealed = new Set(state.revealed);
  const nextExpanded = new Set(state.expanded);
  nextRevealed.add(choiceId);
  nextExpanded.add(choiceId);

  if (clicked?.is_correct) {
    choices.forEach((c) => nextRevealed.add(c.id));
  }

  return {
    state: { revealed: nextRevealed, expanded: nextExpanded },
    shouldAnswer: isFirstEverClick,
  };
}
