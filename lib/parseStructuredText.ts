import { matchCatalog } from "@/lib/matchCatalog";
import type { CatalogLookup, ParsedQuestion } from "@/types/models";

const DIFFICULTIES = ["easy", "medium", "hard"] as const;
const CHOICE_LINE = /^([A-Za-z])\)\s*(.*)$/;
const EXPLANATION_LINE = /^EXPLANATION:\s*(.*)$/i;
const METADATA_LINE = /^(SUBJECT|SYSTEM|TOPIC|DIFFICULTY|HIGH_YIELD|SOURCE):\s*(.*)$/i;

function randomKey(): string {
  return Math.random().toString(36).slice(2, 10);
}

function parseBlock(block: string): ParsedQuestion {
  const warnings: string[] = [];
  const lines = block.split(/\r?\n/);
  let i = 0;

  while (i < lines.length && lines[i].trim() === "") i++;

  // Stem: first line may start with "Q:"; the stem continues until the
  // first recognized metadata line (SUBJECT:, SYSTEM:, etc).
  const stemLines: string[] = [];
  if (i < lines.length) {
    stemLines.push(lines[i].replace(/^\s*Q:\s?/i, ""));
    i++;
  }
  while (i < lines.length && !METADATA_LINE.test(lines[i].trim())) {
    stemLines.push(lines[i]);
    i++;
  }
  const stem = stemLines.join("\n").trim();

  // Metadata fields
  let subjectName = "";
  let systemName = "";
  let topicName = "";
  let difficulty: (typeof DIFFICULTIES)[number] = "medium";
  let highYield = false;
  let source = "";

  while (i < lines.length) {
    const match = METADATA_LINE.exec(lines[i].trim());
    if (!match) break;
    const [, key, value] = match;
    const trimmedValue = value.trim();
    switch (key.toUpperCase()) {
      case "SUBJECT":
        subjectName = trimmedValue;
        break;
      case "SYSTEM":
        systemName = trimmedValue;
        break;
      case "TOPIC":
        topicName = trimmedValue;
        break;
      case "DIFFICULTY": {
        const lower = trimmedValue.toLowerCase();
        if ((DIFFICULTIES as readonly string[]).includes(lower)) {
          difficulty = lower as (typeof DIFFICULTIES)[number];
        } else if (trimmedValue) {
          warnings.push(`Unrecognized difficulty "${trimmedValue}" — defaulted to medium.`);
        }
        break;
      }
      case "HIGH_YIELD":
        highYield = /^(true|yes|1)$/i.test(trimmedValue);
        break;
      case "SOURCE":
        source = trimmedValue;
        break;
    }
    i++;
  }

  while (i < lines.length && lines[i].trim() === "") i++;

  // Choices: "A) text [*]" followed optionally by "EXPLANATION: ..." lines,
  // until the next choice line or the end of the block.
  const choices: ParsedQuestion["choices"] = [];
  while (i < lines.length) {
    const trimmed = lines[i].trim();
    const choiceMatch = CHOICE_LINE.exec(trimmed);
    if (!choiceMatch) {
      i++;
      continue;
    }

    let text = choiceMatch[2].trim();
    let isCorrect = false;
    if (/\*\s*$/.test(text)) {
      isCorrect = true;
      text = text.replace(/\*\s*$/, "").trim();
    }

    i++;
    const explanationLines: string[] = [];
    while (i < lines.length && !CHOICE_LINE.test(lines[i].trim()) && lines[i].trim() !== "") {
      const explanationMatch = EXPLANATION_LINE.exec(lines[i].trim());
      explanationLines.push(explanationMatch ? explanationMatch[1] : lines[i].trim());
      i++;
    }

    choices.push({
      text,
      is_correct: isCorrect,
      explanation: explanationLines.join(" ").trim(),
      order_index: choices.length,
    });
  }

  if (!stem) warnings.push("Question stem is empty.");
  if (choices.length < 2) warnings.push("Fewer than two choices found.");
  else if (!choices.some((c) => c.is_correct)) {
    warnings.push("No choice marked correct — add * after the correct choice's text.");
  }

  return {
    key: randomKey(),
    stem,
    image_url: null,
    difficulty,
    high_yield: highYield,
    topic_id: "",
    subjectName,
    systemName,
    topicName,
    source,
    status: "draft",
    choices,
    warnings,
  };
}

export function parseStructuredText(
  raw: string,
  catalog: CatalogLookup
): ParsedQuestion[] {
  const blocks = raw
    .split(/^\s*-{3,}\s*$/m)
    .map((b) => b.trim())
    .filter((b) => b.length > 0);

  return blocks.map((block) => {
    const parsed = parseBlock(block);
    const { topicId, warnings: matchWarnings } = matchCatalog(
      parsed.subjectName,
      parsed.systemName,
      parsed.topicName,
      catalog
    );
    return {
      ...parsed,
      topic_id: topicId,
      warnings: [...parsed.warnings, ...matchWarnings],
    };
  });
}
