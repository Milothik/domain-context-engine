# Contributing

Run npm ci, npm test and npm run benchmark. Keep changes small and explain the concrete behavior, domain assumptions and checks. Contract changes require a schema/interface migration note and fixture updates. Preserve provenance and rejected decision traces. Add domain validation instead of universal ontology fields. No provider superiority or scientific novelty claims without independently reviewed evidence.

This reference is pre-1.0. Production readiness requires durable transactional state, idempotent generation, authorization/tenant isolation, observed budgets, source licensing review and domain evaluation. Do not submit private materials or credentials. Contributions use the repository's MIT license; imported project materials require separate rights review.


Schemas are source-of-truth in schemas/. npm run build regenerates src/core/schemas.ts deterministically; commit synchronized changes. Domain fixtures and independent gold require reviewed assumptions. See docs/migration-v2.md for changed selection and provenance defaults.
