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
