import type { DecisionProvider, Decision } from "../core/contracts.js";
export class DeterministicDecisionProvider implements DecisionProvider {
  id = "deterministic-v2";
  async select({
    task,
    candidates,
    currentState,
  }: Parameters<DecisionProvider["select"]>[0]): Promise<Decision[]> {
    return candidates.map(({ entity, signals, materialEffects = [] }) => {
      const direct = task.entityIds.includes(entity["@id"]),
        required = task.tags.includes(entity["@type"]),
        continuity =
          currentState.facts.some((f) => f.entityId === entity["@id"]) &&
          materialEffects.includes("continuity");
      const material =
        materialEffects.length > 0 &&
        signals.some((s) => s.startsWith("graph:"));
      const selected = direct || required || material || continuity;
      const effects = [
        ...new Set([
          ...materialEffects,
          ...(direct ? ["identity"] : []),
          ...(required ? ["constraints"] : []),
          ...(continuity ? ["continuity"] : []),
        ]),
      ];
      return {
        candidate: entity["@id"],
        selected,
        reason: selected
          ? "Task seed, required type, or typed relationship with declared material consequences."
          : "Lexical similarity or an untyped association alone does not establish material effect.",
        materialEffects: selected ? effects : [],
        confidence: direct || required ? 1 : material ? 0.85 : 0.5,
        evidence: { signals, policy: this.id },
      };
    });
  }
}
export class CallbackDecisionProvider implements DecisionProvider {
  constructor(
    public id: string,
    private callback: DecisionProvider["select"],
  ) {}
  select(input: Parameters<DecisionProvider["select"]>[0]) {
    return this.callback(structuredClone(input));
  }
}
export {
  ChatCompletionsDecisionProvider,
  ChatCompletionsClient,
} from "./llm.js";
