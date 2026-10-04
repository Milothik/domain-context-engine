import type {
  CandidateRetriever,
  Task,
  DomainEncyclopedia,
} from "../core/contracts.js";
export class StructuredRetriever implements CandidateRetriever {
  async retrieve(task: Task, book: DomainEncyclopedia) {
    const direct = new Set(task.entityIds);
    for (const id of direct)
      if (!book.get(id)) throw Error("Unknown task entity " + id);
    const related = new Set(
      task.entityIds.flatMap((id) => book.get(id)?.relationships ?? []),
    );
    return book
      .all()
      .filter(
        (e) =>
          direct.has(e["@id"]) ||
          related.has(e["@id"]) ||
          task.prompt.toLowerCase().includes(e.name.toLowerCase()) ||
          task.tags.includes(e["@type"]),
      )
      .sort((a, b) => a["@id"].localeCompare(b["@id"], "en"))
      .map((entity) => ({
        entity,
        signals: [
          direct.has(entity["@id"])
            ? "explicit-id"
            : related.has(entity["@id"])
              ? "relationship"
              : "lexical-or-type",
        ],
      }));
  }
}
