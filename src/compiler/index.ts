import type {
  ContextCompiler,
  Entity,
  TaskContext,
  ConstraintDetail,
  KnowledgeWarning,
  Provenance,
} from "../core/contracts.js";
import { fieldSources, relation, normalizedRule } from "../core/knowledge.js";
import { validateContext } from "../core/validation.js";
export interface CompilerOptions {
  allowedProvenanceTypes?: Provenance["type"][];
}
export class CompactContextCompiler implements ContextCompiler {
  constructor(private options: CompilerOptions = {}) {}
  async compile({
    task,
    selected,
    currentState,
    overrides,
    decisions = [],
    maxContextBytes = 65536,
  }: Parameters<ContextCompiler["compile"]>[0]): Promise<TaskContext> {
    const trusted = (p: Provenance[]) =>
      p.length > 0 &&
      p.every((x) =>
        (this.options.allowedProvenanceTypes ?? ["user-canon"]).includes(
          x.type,
        ),
      );
    const warnings: KnowledgeWarning[] = [],
      details: ConstraintDetail[] = [];
    const add = (
      kind: ConstraintDetail["kind"],
      texts: string[],
      source: string,
      priority: number,
    ) =>
      texts.forEach((text) => details.push({ text, kind, source, priority }));
    add("must", overrides.rules?.must ?? [], "human-override", 0);
    add("mustNot", overrides.rules?.mustNot ?? [], "human-override", 0);
    add("must", task.must, "task:" + task.id, 1);
    add("mustNot", task.mustNot, "task:" + task.id, 1);
    const entities = structuredClone(selected).map((e) => {
      const attrs: Entity["attributes"] = Object.create(null),
        fieldProvenance: NonNullable<Entity["fieldProvenance"]> =
          Object.create(null);
      for (const [field, value] of Object.entries(e.attributes)) {
        const p = fieldSources(e, field);
        if (trusted(p)) {
          attrs[field] = value;
          fieldProvenance[field] = p;
        } else
          warnings.push({
            entityId: e["@id"],
            field,
            reason: "Not approved by provenance policy",
            provenance: p,
          });
      }
      for (const [field, value] of Object.entries(
        overrides.locks?.[e["@id"]] ?? {},
      )) {
        attrs[field] = structuredClone(value);
        fieldProvenance[field] = [
          {
            source: "human-override:" + task.id,
            type: "user-canon",
            confidence: 1,
          },
        ];
      }
      if (
        !trusted(fieldSources(e, "rules")) &&
        (e.rules.mustPreserve.length || e.rules.avoid.length)
      )
        throw Error("Unapproved hard constraints require review: " + e["@id"]);
      const rules = trusted(fieldSources(e, "rules"))
        ? e.rules
        : { mustPreserve: [], mayVary: [], avoid: [] };
      add("must", rules.mustPreserve, e["@id"], 2);
      add("mustNot", rules.avoid, e["@id"], 2);
      add("may", rules.mayVary, e["@id"], 3);
      if (!trusted(fieldSources(e, "relationships")) && e.relationships.length)
        warnings.push({
          entityId: e["@id"],
          field: "relationships",
          reason: "Unapproved relationships omitted",
          provenance: fieldSources(e, "relationships"),
        });
      return {
        ...e,
        attributes: { ...attrs },
        fieldProvenance: { ...fieldProvenance },
        rules,
        relationships: trusted(fieldSources(e, "relationships"))
          ? e.relationships
          : [],
      };
    });
    details.sort((a, b) => a.priority - b.priority);
    const unique = (kind: ConstraintDetail["kind"]) => [
      ...new Set(details.filter((d) => d.kind === kind).map((d) => d.text)),
    ];
    const excluded = new Set(unique("mustNot").map(normalizedRule));
    if (unique("must").some((r) => excluded.has(normalizedRule(r))))
      throw Error("Constraint conflict: same predicate required and forbidden");
    const scopedState = (ids: Set<string>) =>
      currentState.facts
        .filter((f) => ids.has(f.entityId))
        .map((f) => {
          const fields = Object.entries(f.value).filter(([field]) => {
            const p = fieldSources(f, field);
            const okay = trusted(p);
            if (
              !okay &&
              !warnings.some(
                (w) =>
                  w.entityId === f.entityId && w.field === "state." + field,
              )
            )
              warnings.push({
                entityId: f.entityId,
                field: "state." + field,
                reason: "Unapproved continuity omitted",
                provenance: p,
              });
            return okay;
          });
          return {
            ...structuredClone(f),
            value: Object.fromEntries(fields),
            fieldProvenance: Object.fromEntries(
              fields.map(([k]) => [k, fieldSources(f, k)]),
            ),
          };
        })
        .filter((f) => Object.keys(f.value).length);
    const omitted: string[] = [];
    let retained = entities;
    const build = (): TaskContext => {
      const ids = new Set(retained.map((e) => e["@id"]));
      return {
        schemaVersion: "2.0",
        task: structuredClone(task),
        entities: retained,
        constraints: {
          must: unique("must"),
          mustNot: unique("mustNot"),
          may: unique("may"),
        },
        constraintDetails: details,
        knowledgeWarnings: warnings,
        omittedEntityIds: omitted,
        relationships: retained.flatMap((e) =>
          e.relationships
            .map(relation)
            .filter((r) => ids.has(r.to))
            .map((r) => ({ from: e["@id"], to: r.to, type: r.type })),
        ),
        continuity: scopedState(ids),
        outputRequirements: {
          ...task.outputRequirements,
          ...overrides.outputRequirements,
        },
      };
    };
    const required = new Set([
      ...task.entityIds,
      ...(overrides.include ?? []),
      ...Object.keys(overrides.locks ?? {}),
      ...entities
        .filter(
          (e) =>
            task.tags.includes(e["@type"]) ||
            e.rules.mustPreserve.length ||
            e.rules.avoid.length,
        )
        .map((e) => e["@id"]),
    ]);
    const priority = (id: string) => {
      const d = decisions.find((d) => d.candidate === id);
      return (d?.confidence ?? 0) * (1 + (d?.materialEffects.length ?? 0));
    };
    const removable = entities
      .filter((e) => !required.has(e["@id"]))
      .sort(
        (a, b) =>
          priority(a["@id"]) - priority(b["@id"]) ||
          a["@id"].localeCompare(b["@id"], "en"),
      );
    let result = build();
    while (
      new TextEncoder().encode(JSON.stringify(result)).length >
        maxContextBytes &&
      removable.length
    ) {
      const e = removable.shift()!;
      omitted.push(e["@id"]);
      retained = retained.filter((x) => x["@id"] !== e["@id"]);
      result = build();
    }
    if (
      new TextEncoder().encode(JSON.stringify(result)).length > maxContextBytes
    )
      throw Error(
        "Context budget exceeded; mandatory facts and provenance cannot be silently truncated",
      );
    validateContext(result);
    return result;
  }
}
