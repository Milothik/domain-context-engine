# Evaluation methodology v2

## Independent annotations

benchmarks/fixtures/cases.json contains manually authored gold IDs, constraints, entity fields and continuity fields for three synthetic domains: comic, product brand and game state. The oracle is static and independent of the compiled arm. Mutation tests remove facts, rules and state and confirm that scores fall. The fixtures intentionally include unrelated archival material; this is a controlled stress case, not a representative production corpus.

## Four arms

1. Raw task/prompt only.
2. Full encyclopedia and current state.
3. Ranked retrieval only, with current state.
4. Retrieval + decision + provenance-aware compiler with scoped state.

All arms share the same task. Offline metrics measure UTF-8 bytes, selected-ID precision/recall, exact constraint recall, gold field accuracy, scoped continuity accuracy and irrelevant entities/state. Empty prediction precision and empty continuity denominators use 1; inspect recall and counts too. These measures describe input information, not generated-output quality. The gold does not derive from selected entity rules.

Run npm run benchmark. benchmarks/results/offline-v2.json records the actual offline run. Compiled input can be larger than retrieval because it contains provenance, priorities and trace information; no universal compression or quality improvement is claimed. Larger archive dumps in the fixtures are intentionally inefficient. Report that assumption whenever presenting byte reductions.

## Actual model evaluation

Run npm run benchmark:live only with explicit ALLOW_LIVE_EVAL=1 and a configured endpoint/model/key. A real LLM selects the compiled arm. Each of the four arms then uses the same factual-brief instruction and model. Gold is never sent to the model. The output rubric measures required entity/fact/constraint/continuity reconstruction and irrelevant entities, not visual quality or narrative coherence. Reports store actual outputs, usage/model IDs, input bytes, latency, fixture hash and scorer hash. Failures are recorded separately, never turned into favourable scores. Provider failures in the compiled decision stage prevent that case's generation arms and must be reported as failures.

This harness is a starting point. Repeat runs with versioned model settings, expand held-out gold cases, randomize order to control provider drift, inspect hallucinated/extra attributes, and use blind domain reviewers for natural-language/media output. Current scores check required fields; they are not a complete hallucination or semantic-equivalence detector. No live quality results are bundled in this release.
