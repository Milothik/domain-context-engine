# Domain Context Engine

Turn domain knowledge into generation-ready context.

A reference architecture and agent playbook for building domain-aware generative systems from structured project knowledge. Most generative systems pass project knowledge as prompt text or retrieved documents. Here, explicit entities form a Domain Encyclopedia; Candidate Discovery and the Decision Layer have separate responsibilities; a Context Compiler produces a task-specific JSON object before generation.

Knowledge → Discover → Decide → Compile → Generate → Validate → Update

## Start

Requires Node.js 22+ and npm. No API key is needed.

```sh
npm ci
npm test
npm run demo
npm run benchmark
```

Give a coding agent this repository, your source materials, and: **“Follow AGENTS.md to implement this architecture for my project.”** Begin with [AGENTS.md](AGENTS.md), [architecture](ARCHITECTURE.md), and [the intake schema](schemas/project-intake.schema.json).

## v2 (package 0.2.0)

- Ranked lexical/typed graph discovery with bounded multi-hop traversal and explicit seed protection.
- Consequence-based deterministic selection and an executable HTTP LLM decision provider.
- Core JSON Schema validation, exact-predicate conflict detection and mandatory constraint checks, even with custom adapters.
- State patches merge fields and nested objects; continuity keeps field provenance and optimistic concurrency.
- Compiler provenance policy, constraint origins/priorities and audited optional context pruning using decision confidence and material effects.
- Independent gold annotations in three domains, four evaluation arms, and an opt-in live LLM evaluation harness.

See [migration and limits](docs/migration-v2.md), [LLM setup](docs/llm-provider.md), [benchmark methodology](docs/benchmark-methodology.md) and [release notes](CHANGELOG.md). All standard demos/tests remain offline.

## Motivating case: WeirdWay

Instead of only “Draw Yastrik at the station”, a comic implementation resolves the character, station, clothing, relationships, timeline, tone, comic grammar and previous-page continuity; decides what materially affects this page; compiles Page Context JSON; and passes it to an image provider. See [the sanitized reference case](examples/weirdway/README.md). All included data is invented for demonstration; it is not actual WeirdWay canon or private assets. The original Comic Studio is not a dependency and has not been modified.

[Product brand](examples/product-brand/README.md) changes the entity types, selection criteria, compiler and output adapter while retaining the engine.

## Scope

This is a small executable reference implementation, not a hosted product. It includes typed contracts, ranked discovery, deterministic and HTTP LLM decision providers, core-validated task contexts, inspectable traces, human overrides, scoped continuity, an offline generation preview, contract tests and a benchmark harness. Generation and persistence providers are replaceable. Real image/video generation, ingestion/OCR and durable storage require project adapters. No strategy is claimed universally better; [choose one explicitly](docs/decision-layer.md).

The runtime entity envelope is structured JSON. The example context file maps it to JSON-LD without runtime network context resolution; domain adapters must supply and version their own ontology. Schemas validate structure, not factual truth. Confidence means provider assessment, not calibrated probability.

## Stability

Version 0.2.0 is the v2 reference release and remains pre-1.0. Public interfaces live in src/core/contracts.ts; the default compiler emits schemaVersion 2.0. Legacy entity links and version 1.0 contexts remain readable, with migration limits documented. See [contributing](CONTRIBUTING.md) for compatibility and quality gates. Code and documentation use the [MIT license](LICENSE). Project materials brought into a deployment retain their own rights and permissions.
