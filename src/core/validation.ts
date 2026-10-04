import { Ajv } from "ajv";
import type {
  Decision,
  Entity,
  Task,
  TaskContext,
  State,
  Overrides,
  Json,
} from "./contracts.js";
import {
  entitySchema,
  taskSchema,
  contextSchema,
  decisionsSchema,
  stateSchema,
  overridesSchema,
} from "./schemas.js";
import { normalizedRule } from "./knowledge.js";
const ajv = new Ajv({ strict: true, allErrors: true, ownProperties: true });
export function validateJson(value: unknown): asserts value is Json {
  const active = new Set<object>();
  const visit = (v: unknown, depth: number): void => {
    if (depth > 128) throw Error("JSON nesting limit exceeded");
    if (v === null || typeof v === "string" || typeof v === "boolean") return;
    if (typeof v === "number" && Number.isFinite(v)) return;
    if (
      typeof v !== "object" ||
      v === null ||
      (!Array.isArray(v) &&
        Object.getPrototypeOf(v) !== Object.prototype &&
        Object.getPrototypeOf(v) !== null)
    )
      throw Error("Expected plain finite JSON data");
    if (active.has(v)) throw Error("Cyclic JSON data");
    active.add(v);
    if (Array.isArray(v))
      for (let i = 0; i < v.length; i++) visit(v[i], depth + 1);
    else for (const child of Object.values(v)) visit(child, depth + 1);
    active.delete(v);
  };
  visit(value, 0);
}
const validators = {
  entity: ajv.compile(entitySchema),
  task: ajv.compile(taskSchema),
  context: ajv.compile(contextSchema),
  decisions: ajv.compile(decisionsSchema),
  state: ajv.compile(stateSchema),
  overrides: ajv.compile(overridesSchema),
};
function assert(kind: keyof typeof validators, value: unknown) {
  validateJson(value);
  if (!validators[kind](value))
    throw Error(
      "Invalid " + kind + " schema: " + ajv.errorsText(validators[kind].errors),
    );
}
export function validateEntity(value: unknown): asserts value is Entity {
  assert("entity", value);
}
export function validateTask(value: unknown): asserts value is Task {
  assert("task", value);
}
export function validateState(value: unknown): asserts value is State {
  assert("state", value);
  const ids = (value as State).facts.map((f) => f.entityId);
  if (new Set(ids).size !== ids.length)
    throw Error(
      "Duplicate state entity; consolidate legacy facts before loading",
    );
}
export function validateOverrides(value: unknown): asserts value is Overrides {
  assert("overrides", value);
}
export function validateDecisions(
  value: unknown,
  ids: string[],
): asserts value is Decision[] {
  assert("decisions", value);
  const rows = value as Decision[];
  const seen = new Set(rows.map((d) => d.candidate));
  if (
    rows.length !== seen.size ||
    seen.size !== ids.length ||
    rows.some((d) => !ids.includes(d.candidate))
  )
    throw Error(
      "Invalid decision result: provider must explain every candidate exactly once",
    );
}
export function validateContext(value: unknown): asserts value is TaskContext {
  assert("context", value);
  const c = value as TaskContext;
  const ids = new Set(c.entities.map((e) => e["@id"]));
  if (ids.size !== c.entities.length) throw Error("Duplicate context entity");
  if (
    c.relationships.some((r) => !ids.has(r.from) || !ids.has(r.to)) ||
    c.continuity.some((f) => !ids.has(f.entityId))
  )
    throw Error("Unscoped context relationship or continuity");
  const forbidden = new Set(c.constraints.mustNot.map(normalizedRule));
  if (c.constraints.must.some((r) => forbidden.has(normalizedRule(r))))
    throw Error("Constraint conflict: same predicate required and forbidden");
  if (c.schemaVersion === "2.0")
    for (const d of c.constraintDetails!)
      if (!c.constraints[d.kind].includes(d.text))
        throw Error("Constraint detail is absent from constraints");
}
