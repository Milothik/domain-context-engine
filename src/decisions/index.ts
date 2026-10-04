import type { DecisionProvider, Decision } from "../core/contracts.js";
export class DeterministicDecisionProvider implements DecisionProvider {
  id = "deterministic-v1";
  async select({
    task,
    candidates,
  }: Parameters<DecisionProvider["select"]>[0]): Promise<Decision[]> {
    return candidates.map(({ entity, signals }) => {
      const selected =
        task.entityIds.includes(entity["@id"]) ||
        task.tags.includes(entity["@type"]);
      return {
        candidate: entity["@id"],
        selected,
        reason: selected
          ? "Explicit task ID or required entity type."
          : "Discovered association has no explicit material effect under this policy.",
        materialEffects: selected ? ["identity", "constraints"] : [],
        confidence: 1,
        evidence: { signals, policy: this.id },
      };
    });
  }
}
/** Callback adapter for LLMs, external services (including Jev), or hybrid policies.
 * Transport, retries, evidence mapping and costs belong in the callback. */
export class CallbackDecisionProvider implements DecisionProvider {
  constructor(
    public id: string,
    private callback: DecisionProvider["select"],
  ) {}
  select(input: Parameters<DecisionProvider["select"]>[0]) {
    return this.callback(structuredClone(input));
  }
}
