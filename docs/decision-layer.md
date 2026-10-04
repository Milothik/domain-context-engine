# decision layer

Choose and record a strategy before integration.

| Strategy | Use when | Validate |
| --- | --- | --- |
| Deterministic | Explicit rules, reproducibility, simple candidates, hard constraints | Tie ordering, invariants, coverage |
| Model | Meaning or ambiguity makes rules unwieldy; visual/narrative consequences matter | Versioned prompt/model, evidence, repeatability and cost |
| Decision service | Comparative judgement, consequence scoring and evidence traces are central | Actual API contract, privacy, scores and failures |
| Hybrid | Rules narrow candidates; semantic judgement resolves remaining choices | Hard constraints before and after judgement |

Ask which facts materially affect identity, continuity, factual correctness, representation, permitted actions, style, state, relationships or user intent. No provider is universally best. CallbackDecisionProvider accepts any implementation; Jev is only a possible external service and has no hardwired endpoint. Return decisions for every candidate; preserve richer evidence. Confidence 1 in the deterministic fixture means rule certainty, not truth of the source. Human overrides retain the original provider decision as evidence.


## V2 implementations

DeterministicDecisionProvider now uses graph edges with declared materialEffects in addition to task seeds/types. Effects are reviewed domain metadata, not proof of relevance. ChatCompletionsDecisionProvider executes a configurable LLM HTTP protocol with strict local response validation; see [setup](llm-provider.md). Confidence and effect count influence optional compiler pruning, never truth or mandatory constraints.
