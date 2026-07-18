export type DifficultyLevel = "easy" | "medium" | "hard";
export type QuestionStatus = "draft" | "published";

export interface Subject {
  id: string;
  name: string;
}

export interface System {
  id: string;
  name: string;
  subject_id: string;
}

export interface Topic {
  id: string;
  name: string;
  system_id: string;
}

export interface Choice {
  id?: string;
  text: string;
  is_correct: boolean;
  explanation: string;
  order_index: number;
}

export interface Question {
  id: string;
  stem: string;
  image_url: string | null;
  difficulty: DifficultyLevel;
  high_yield: boolean;
  topic_id: string;
  source: string | null;
  status: QuestionStatus;
  created_by: string | null;
  created_at: string;
}

// Shape returned by the admin question-list query, which embeds the
// subject/system/topic chain via Supabase's nested select.
export interface QuestionListRow {
  id: string;
  stem: string;
  status: QuestionStatus;
  difficulty: DifficultyLevel;
  created_at: string;
  topics: {
    name: string;
    systems: {
      name: string;
      subjects: {
        name: string;
      } | null;
    } | null;
  } | null;
}

export interface QuestionFormInput {
  stem: string;
  image_url: string | null;
  difficulty: DifficultyLevel;
  high_yield: boolean;
  topic_id: string;
  source: string;
  status: QuestionStatus;
  choices: Choice[];
}

// --- Bulk import (Stage 5) -------------------------------------------------

export interface CatalogLookup {
  subjects: Subject[];
  systems: System[];
  topics: Topic[];
}

// A question parsed from structured text or an Excel row, before the admin
// has reviewed/edited it in the import preview. `subjectName` / `systemName`
// / `topicName` are the raw strings found in the source (for display when a
// name couldn't be matched to an existing catalog entry); `topic_id` is only
// set once a match is confirmed (by the parser or by the admin picking one
// in the preview).
export interface ParsedQuestion {
  key: string;
  stem: string;
  image_url: string | null;
  difficulty: DifficultyLevel;
  high_yield: boolean;
  topic_id: string;
  subjectName: string;
  systemName: string;
  topicName: string;
  source: string;
  status: QuestionStatus;
  choices: Choice[];
  warnings: string[];
}

// --- Quiz engine (Stage 6) --------------------------------------------------

export type QuizMode = "tutor" | "timed" | "exam";
export type QuizScope = "all" | "unanswered" | "incorrect" | "bookmarked";

export interface HighlightRange {
  start: number;
  end: number;
}

export interface Quiz {
  id: string;
  user_id: string;
  mode: QuizMode;
  created_at: string;
  submitted_at: string | null;
  time_limit_minutes: number | null;
  paused_at: string | null;
  total_paused_seconds: number;
}

// A choice as delivered to the quiz-taking client. `is_correct` and
// `explanation` are only populated when it's safe to reveal them (Tutor
// mode, or once the quiz has been submitted) — see app/quiz/[id]/page.tsx,
// which omits these columns from the query entirely in Timed/Exam mode so
// they never reach the browser before the student answers.
export interface QuizChoice {
  id: string;
  text: string;
  order_index: number;
  is_correct?: boolean;
  explanation?: string;
}

export interface QuizQuestionContent {
  id: string; // question id
  stem: string;
  image_url: string | null;
  difficulty: DifficultyLevel;
  source: string | null;
  choices: QuizChoice[];
}

// One entry the quiz-taking UI renders: a quiz_questions row joined with
// its question content and current bookmark status.
export interface QuizItem {
  quizQuestionId: string;
  question: QuizQuestionContent;
  selected_choice_id: string | null;
  is_correct: boolean | null;
  time_spent: number;
  eliminated_choice_ids: string[];
  highlighted_ranges: HighlightRange[];
  is_marked: boolean;
  is_bookmarked: boolean;
}

export interface QuizCreateFilters {
  topicIds: string[];
  difficulties: DifficultyLevel[];
  scope: QuizScope;
  numQuestions: number;
  mode: "tutor" | "timed";
  timeLimitMinutes: number | null;
}

export interface SubjectBreakdown {
  subjectName: string;
  correct: number;
  total: number;
}
