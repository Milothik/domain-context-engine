import type {
  CandidateRetriever,
  Task,
  DomainEncyclopedia,
  Candidate,
} from "../core/contracts.js";
import { relation, canonical, fieldSources } from "../core/knowledge.js";
export interface RetrievalOptions {
  maxDepth?: number;
  maxCandidates?: number;
  relationTypes?: string[];
}
export class StructuredRetriever implements CandidateRetriever {
  constructor(private options: RetrievalOptions = {}) {
    if (
      !Number.isInteger(options.maxDepth ?? 2) ||
      (options.maxDepth ?? 2) < 0 ||
      (options.maxDepth ?? 2) > 8
    )
      throw Error("maxDepth must be 0..8");
    if (
      !Number.isInteger(options.maxCandidates ?? 100) ||
      (options.maxCandidates ?? 100) < 1
    )
      throw Error("maxCandidates must be positive");
  }
  async retrieve(task: Task, book: DomainEncyclopedia): Promise<Candidate[]> {
    const entries = book.all(),
      byId = new Map(entries.map((e) => [e["@id"], e])),
      found = new Map<string, Candidate>();
    const tokens = new Set(
      task.prompt.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [],
    );
    const add = (
      id: string,
      score: number,
      signal: string,
      depth: number,
      effects: string[] = [],
      paths: NonNullable<Candidate["paths"]> = [],
    ) => {
      const entity = byId.get(id)!;
      const old = found.get(id);
      found.set(id, {
        entity,
        score: Math.max(old?.score ?? 0, score),
        depth: Math.min(old?.depth ?? depth, depth),
        signals: [...new Set([...(old?.signals ?? []), signal])],
        materialEffects: [
          ...new Set([...(old?.materialEffects ?? []), ...effects]),
        ],
        paths: [...(old?.paths ?? []), ...paths].slice(0, 8),
      });
    };
    for (const id of task.entityIds) {
      if (!byId.has(id)) throw Error("Unknown task entity " + id);
      add(id, 100, "explicit-id", 0, ["identity"]);
    }
    for (const e of entries) {
      if (task.tags.includes(e["@type"]))
        add(e["@id"], 80, "required-type", 0, ["constraints"]);
      const words = e.name.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
      const hits = words.filter((t) => tokens.has(t)).length;
      if (hits) add(e["@id"], (40 * hits) / words.length, "lexical", 0);
    }
    let frontier = [...found.values()].map((c) => ({
      id: c.entity["@id"],
      path: [] as { from: string; to: string; type: string }[],
      effects: [] as string[],
    }));
    const visited = new Set(frontier.map((n) => n.id));
    for (
      let depth = 1;
      depth <= (this.options.maxDepth ?? 2) && frontier.length;
      depth++
    ) {
      const next: typeof frontier = [];
      for (const node of frontier)
        for (const raw of byId.get(node.id)!.relationships) {
          const r = relation(raw);
          if (
            this.options.relationTypes &&
            !this.options.relationTypes.includes(r.type)
          )
            continue;
          const p = [...node.path, { from: node.id, to: r.to, type: r.type }];
          // Consequences belong to the current edge, not every later neighbour.
          // Unapproved relationships remain discoverable but cannot force selection.
          const approved = canonical(
            fieldSources(byId.get(node.id)!, "relationships"),
          );
          const effects = approved ? [...new Set(r.materialEffects ?? [])] : [];
          add(r.to, 60 / depth, "graph:" + r.type, depth, effects, [p]);
          if (!approved) add(r.to, 60 / depth, "unapproved-edge", depth);
          if (!visited.has(r.to)) {
            visited.add(r.to);
            next.push({ id: r.to, path: p, effects });
          }
        }
      frontier = next;
    }
    const ranked = [...found.values()].sort(
      (a, b) =>
        (b.score ?? 0) - (a.score ?? 0) ||
        a.entity["@id"].localeCompare(b.entity["@id"], "en"),
    );
    const required = ranked.filter(
      (c) =>
        task.entityIds.includes(c.entity["@id"]) ||
        task.tags.includes(c.entity["@type"]),
    );
    if (required.length > (this.options.maxCandidates ?? 100))
      throw Error("Candidate budget cannot drop required seeds");
    const requiredIds = new Set(required.map((c) => c.entity["@id"]));
    return [
      ...required,
      ...ranked
        .filter((c) => !requiredIds.has(c.entity["@id"]))
        .slice(0, (this.options.maxCandidates ?? 100) - required.length),
    ];
  }
}
