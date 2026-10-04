import type { State, StateFact, StateStore, Json } from "../core/contracts.js";
import { validateState } from "../core/validation.js";
import { uniqueSources, fieldSources } from "../core/knowledge.js";
function mergeValue(before: Json, patch: Json): Json {
  if (
    before &&
    patch &&
    typeof before === "object" &&
    typeof patch === "object" &&
    !Array.isArray(before) &&
    !Array.isArray(patch)
  ) {
    return Object.fromEntries(
      [...new Set([...Object.keys(before), ...Object.keys(patch)])].map((k) => [
        k,
        Object.hasOwn(patch, k)
          ? Object.hasOwn(before, k)
            ? mergeValue(before[k]!, patch[k]!)
            : structuredClone(patch[k]!)
          : structuredClone(before[k]!),
      ]),
    );
  }
  return structuredClone(patch);
}
export class MemoryStateStore implements StateStore {
  private state: State;
  constructor(initial: State = { version: 0, facts: [] }) {
    validateState(initial);
    this.state = structuredClone(initial);
  }
  async read() {
    return structuredClone(this.state);
  }
  async commit(expectedVersion: number, facts: StateFact[]) {
    if (this.state.version !== expectedVersion)
      throw Error(
        "State version conflict; reconcile before retrying generation",
      );
    // Validate the whole batch before any mutation; multiple patches for one entity are legal.
    for (const f of facts)
      validateState({ version: expectedVersion, facts: [f] });
    const merged = new Map(
      this.state.facts.map((f) => [f.entityId, structuredClone(f)]),
    );
    for (const patch of facts) {
      const old = merged.get(patch.entityId);
      const oldFields = old
        ? Object.fromEntries(
            Object.keys(old.value).map((k) => [k, fieldSources(old, k)]),
          )
        : Object.create(null);
      const patchFields = Object.fromEntries(
        Object.keys(patch.value).map((k) => [k, fieldSources(patch, k)]),
      );
      const fieldProvenance = {
        ...oldFields,
        ...Object.fromEntries(
          Object.entries(patchFields).map(([k, p]) => {
            const before = old?.value[k],
              after = patch.value[k];
            const nestedMerge =
              before !== null &&
              after !== null &&
              typeof before === "object" &&
              typeof after === "object" &&
              !Array.isArray(before) &&
              !Array.isArray(after);
            return [
              k,
              nestedMerge ? uniqueSources([...(oldFields[k] ?? []), ...p]) : p,
            ];
          }),
        ),
      };
      merged.set(patch.entityId, {
        entityId: patch.entityId,
        value: mergeValue(old?.value ?? {}, patch.value) as Record<
          string,
          Json
        >,
        provenance: uniqueSources([
          ...(old?.provenance ?? []),
          ...patch.provenance,
        ]),
        fieldProvenance,
      });
    }
    this.state = { version: expectedVersion + 1, facts: [...merged.values()] };
  }
}
