import type { State, StateFact, StateStore } from "../core/contracts.js";
export class MemoryStateStore implements StateStore {
  private state: State;
  constructor(initial: State = { version: 0, facts: [] }) {
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
    const merged = new Map(this.state.facts.map((f) => [f.entityId, f]));
    for (const f of facts) merged.set(f.entityId, structuredClone(f));
    this.state = { version: expectedVersion + 1, facts: [...merged.values()] };
  }
}
