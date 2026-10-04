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

## Motivating case: WeirdWay

Instead of only “Draw Yastrik at the station”, a comic implementation resolves the character, station, clothing, relationships, timeline, tone, comic grammar and previous-page continuity; decides what materially affects this page; compiles Page Context JSON; and passes it to an image provider. See [the sanitized reference case](examples/weirdway/README.md). All included data is invented for demonstration; it is not actual WeirdWay canon or private assets. The original Comic Studio is not a dependency and has not been modified.

[Product brand](examples/product-brand/README.md) changes the entity types, selection criteria, compiler and output adapter while retaining the engine.

## Scope

This is a small executable reference implementation, not a hosted product. It includes typed contracts, deterministic discovery/selection, callback decision adapters, validated task contexts, inspectable traces, human overrides, scoped continuity, an offline generation preview, contract tests and a benchmark harness. Generation and persistence providers are replaceable. Real image/video generation, ingestion/OCR and durable storage require project adapters. No strategy is claimed universally better; [choose one explicitly](docs/decision-layer.md).

The runtime entity envelope is structured JSON. The example context file maps it to JSON-LD without runtime network context resolution; domain adapters must supply and version their own ontology. Schemas validate structure, not factual truth. Confidence means provider assessment, not calibrated probability.

## Stability

Version 0.1 is experimental. Public interfaces live in src/core/contracts.ts; schemaVersion 1.0 identifies the context envelope, not a guarantee of stable domain ontologies. See [contributing](CONTRIBUTING.md) for compatibility and quality gates. Code and documentation use the [MIT license](LICENSE). Project materials brought into a deployment retain their own rights and permissions.
