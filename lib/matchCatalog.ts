import type { CatalogLookup } from "@/types/models";

function normalize(name: string): string {
  return name.trim().toLowerCase();
}

export interface CatalogMatchResult {
  topicId: string;
  warnings: string[];
}

// Resolves free-text Subject/System/Topic names (from pasted text or a
// spreadsheet row) to an existing topic_id by case-insensitive exact match,
// scoped correctly at each level (a System is only matched within the
// chosen Subject, a Topic only within the chosen System). Anything that
// doesn't resolve is left for the admin to fix in the import preview.
export function matchCatalog(
  subjectName: string,
  systemName: string,
  topicName: string,
  catalog: CatalogLookup
): CatalogMatchResult {
  const warnings: string[] = [];

  if (!subjectName) {
    warnings.push("No subject specified.");
    return { topicId: "", warnings };
  }

  const subject = catalog.subjects.find(
    (s) => normalize(s.name) === normalize(subjectName)
  );
  if (!subject) {
    warnings.push(`Subject "${subjectName}" doesn't match any existing subject.`);
    return { topicId: "", warnings };
  }

  if (!systemName) {
    warnings.push("No system specified.");
    return { topicId: "", warnings };
  }

  const system = catalog.systems.find(
    (s) => s.subject_id === subject.id && normalize(s.name) === normalize(systemName)
  );
  if (!system) {
    warnings.push(
      `System "${systemName}" doesn't match any existing system under "${subject.name}".`
    );
    return { topicId: "", warnings };
  }

  if (!topicName) {
    warnings.push("No topic specified.");
    return { topicId: "", warnings };
  }

  const topic = catalog.topics.find(
    (t) => t.system_id === system.id && normalize(t.name) === normalize(topicName)
  );
  if (!topic) {
    warnings.push(
      `Topic "${topicName}" doesn't match any existing topic under "${system.name}".`
    );
    return { topicId: "", warnings };
  }

  return { topicId: topic.id, warnings };
}
