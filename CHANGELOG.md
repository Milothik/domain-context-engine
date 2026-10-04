# Changelog

## 0.2.0 — v2

Fix state replacement data loss with recursive atomic field patches and field provenance. Move structural validation to the core, validate all candidate decisions, enforce hard constraints and human overrides, and preserve generated output in StateCommitError on continuity commit failure.

Add ranked multi-hop typed graph retrieval with bounded paths and seed protection, consequence-based deterministic decisions, and a transport-backed configurable LLM decision provider with timeout, byte/token limits, scoped state and fail-closed replies.

Add provenance-aware compilation, constraint origins/priorities, exact-predicate conflict checks and audited optional pruning using confidence/material effects. Default approval is user-canon; uncertain/generated claims are withheld and traced.

Replace circular benchmark expectations with independently authored gold for three domains. Add four-arm context diagnostics, mutation checks and an opt-in actual LLM output evaluator. No remote LLM quality result is fabricated or bundled.

Package/context versions are now 0.2.0/2.0. Legacy string links and v1 context validation remain supported; changed defaults are documented in docs/migration-v2.md. No original WeirdWay content or application was changed.

## 0.1.0

Initial reference contracts, agent workflow, deterministic examples, human overrides, scoped memory state, tests and payload benchmark.
