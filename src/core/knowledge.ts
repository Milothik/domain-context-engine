import type { Entity, Relationship, Provenance } from "./contracts.js";
export const relation = (value: string | Relationship): Relationship =>
  typeof value === "string" ? { to: value, type: "related" } : value;
export const canonical = (sources: Provenance[]) =>
  sources.length > 0 && sources.every((p) => p.type === "user-canon");
export const uniqueSources = (sources: Provenance[]) => [
  ...new Map(sources.map((p) => [JSON.stringify(p), p])).values(),
];
export function fieldSources(
  entity: Pick<Entity, "fieldProvenance" | "provenance">,
  field: string,
) {
  return entity.fieldProvenance && Object.hasOwn(entity.fieldProvenance, field)
    ? entity.fieldProvenance[field]!
    : entity.provenance;
}
export const normalizedRule = (rule: string) =>
  rule.trim().replace(/\s+/g, " ").toLowerCase();
