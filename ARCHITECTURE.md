# Architecture v2

Raw sources → agent ingestion → versioned Domain Encyclopedia → ranked Candidate Discovery → consequence-based DecisionProvider → provenance-aware ContextCompiler → core validation → GenerationProvider → OutputAdapter → domain output validation → state patches → version-checked StateStore.

## Improvements over v1

The original decision strategy ignored discovered associations, state replacement could lose fields, and schemas were applied only by the examples. V2 moves validation into the engine and encyclopedia, adds typed graph signals, and merges continuity updates. Transport-backed LLM decisions have an explicit protocol and limits rather than requiring an unimplemented callback.

Encyclopedia IDs resolve to authoritative entities after retrieval; a retriever cannot change canon by returning modified attributes. Discovery uses lexical coverage and bounded breadth-first graph traversal, records paths and effects, and sorts by score and stable ID. Decision remains separate: task seeds, required types and graph edges with declared material consequences are selected by the deterministic policy. Untyped legacy links do not imply necessity.

The compiler approves fields according to provenance policy (default: user-canon only), records withheld claims, preserves constraint source and priority, detects opposite exact predicates, and drops only optional entities under a byte budget. Confidence/effect count orders optional omissions and never overrides mandatory constraints or human locks. Core validation catches malformed custom compiler output, constraint loss and override violations.

State patches recursively merge object keys; scalars, arrays and null replace their field. Per-field provenance distinguishes untouched data from generated patches; nested merges conservatively combine sources. A whole batch validates before mutation. Version conflicts prevent lost writes. StateCommitError carries the validated output/context if a commit fails, allowing recovery without automatic regeneration.

## Remaining scalability and production work

MemoryEncyclopedia scans and clones data; ranked retrieval is not an indexed search backend. Breadth-first traversal has bounded depth, per-candidate paths and returned candidate count, but densely connected graphs can still require large work before trimming. Replace with a bounded indexed graph/lexical/vector backend for large corpora. The compiler keeps full approved fields of retained entities: domain projections and model token budgets remain necessary. Byte budgeting is exact JSON UTF-8 size, not model tokens.

State remains in-memory and process-local. Durable deployments need transactions, idempotency ledgers, an outbox, tenant authorization and retention. StateCommitError preserves a result in the current process, not after a crash. No automatic HTTP retry is performed, preventing hidden duplicate API costs; transport failures require explicit retry policy. LLM output validation establishes contract conformance, not truth or prompt-injection immunity. Domain output validation and human review remain required for canon updates.

## Compatibility and scientific traceability

Contracts remain provider independent. Structured JSON and legacy links adapt to typed relations; no universal ontology is imposed. Generated runtime schemas are synchronized from schemas/ during build. Traces record provider, encyclopedia, state, context version, decisions, overrides, omissions and withheld knowledge. Source hashes and claim-level provenance must be supplied by ingestion; the engine does not fabricate source evidence. Evaluation gold is independently authored and never derived from compiled output. Synthetic context checks cannot establish model superiority.
