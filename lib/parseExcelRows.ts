import { matchCatalog } from "@/lib/matchCatalog";
import type { CatalogLookup, DifficultyLevel, ParsedQuestion } from "@/types/models";

const DIFFICULTIES: DifficultyLevel[] = ["easy", "medium", "hard"];
const CHOICE_COLUMNS = [1, 2, 3, 4, 5];

export type ExcelRow = Record<string, string | number | boolean | undefined>;

function cell(row: ExcelRow, key: string): string {
  const value = row[key];
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function randomKey(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function parseExcelRows(
  rows: ExcelRow[],
  catalog: CatalogLookup
): ParsedQuestion[] {
  return rows
    .filter((row) => cell(row, "Question") !== "")
    .map((row) => {
      const warnings: string[] = [];
      const stem = cell(row, "Question");

      const correctRaw = cell(row, "CorrectAnswer");
      const correctIndices = new Set(
        correctRaw
          .split(/[,;]/)
          .map((s) => parseInt(s.trim(), 10))
          .filter((n) => !Number.isNaN(n))
      );

      const choices = CHOICE_COLUMNS.map((n) => ({
        text: cell(row, `Choice${n}`),
        explanation: cell(row, `Explanation${n}`),
        n,
      }))
        .filter((c) => c.text !== "")
        .map((c, index) => ({
          text: c.text,
          is_correct: correctIndices.has(c.n),
          explanation: c.explanation,
          order_index: index,
        }));

      if (choices.length < 2) {
        warnings.push("Fewer than two choices found.");
      } else if (!choices.some((c) => c.is_correct)) {
        warnings.push(
          `No choice marked correct — check the "Correct Answer" column (e.g. "1" or "1,3").`
        );
      }
      if (!stem) warnings.push("Question text is empty.");

      const difficultyRaw = cell(row, "Difficulty").toLowerCase();
      let difficulty: DifficultyLevel = "medium";
      if (difficultyRaw && (DIFFICULTIES as string[]).includes(difficultyRaw)) {
        difficulty = difficultyRaw as DifficultyLevel;
      } else if (difficultyRaw) {
        warnings.push(`Unrecognized difficulty "${cell(row, "Difficulty")}" — defaulted to medium.`);
      }

      const subjectName = cell(row, "Subject");
      const systemName = cell(row, "System");
      const topicName = cell(row, "Topic");
      const { topicId, warnings: matchWarnings } = matchCatalog(
        subjectName,
        systemName,
        topicName,
        catalog
      );

      return {
        key: randomKey(),
        stem,
        image_url: null,
        difficulty,
        high_yield: /^(true|yes|1)$/i.test(cell(row, "HighYield")),
        topic_id: topicId,
        subjectName,
        systemName,
        topicName,
        source: cell(row, "Source"),
        status: "draft" as const,
        choices,
        warnings: [...warnings, ...matchWarnings],
      };
    });
}
