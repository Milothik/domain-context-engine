# Migration to v2 / 0.2.0

The repository's second iteration is package 0.2.0, not a stable major-version promise. It introduces a default Task Context schemaVersion 2.0. The v1 context schema is retained in schemas/legacy/task-context-v1.schema.json.

## Entity relationships

Legacy string IDs still load and normalize to type related. Prefer objects: { "to": "domain:station", "type": "located-at", "materialEffects": ["continuity"] }. Mark effects based on reviewed domain rules, not similarity. Edges remain outgoing and directed. IDs and referential integrity are validated.

## Changed defaults

Discovery now ranks lexical coverage and traverses up to two hops. Deterministic selection includes discovered entities connected by edges with declared effects. Candidate limits fail if required seeds cannot fit. Providers still explain every candidate.

Only user-canon provenance is approved by the default compiler. Mixed/uncertain/generated fields are withheld and traced; unapproved hard rules require review. Set fieldProvenance per attribute, or supply an explicit allowedProvenanceTypes policy when the domain deliberately allows external/inferred sources. Approval is a project policy, not a scientific validation claim.

The compiler adds constraintDetails, knowledgeWarnings and omittedEntityIds. Conflict detection covers the same normalized predicate appearing in must and mustNot; it cannot interpret all natural-language contradictions. Priority preserves ordering and origin, never silently resolves contradictory rules. Custom compilers receive optional decisions and maxContextBytes; the engine enforces schema, mandatory constraints, selection/field/output overrides and final byte budget.

## State

Legacy state snapshots with one entry per entity still load. Duplicate entity entries must be consolidated explicitly before loading. A commit accepts multiple patches per entity. Objects merge recursively; arrays/scalars/null replace. Absence leaves a field intact. Null is a stored value, not deletion. No implicit field deletion is supported. Top-level fieldProvenance records sources; merged nested objects retain conservative combined provenance, so a generated nested patch can quarantine the whole top-level object until reviewed. Scalar replacement uses the new source while aggregate provenance retains history.

StateCommitError exposes output/context and cause for post-generation commit failures. Do not rerun generation blindly. Durable crash recovery remains a deployment concern.

## Verification

Run npm ci, npm test, npm run demo and npm run benchmark. Add domain-specific validation to ProjectAdapter; statelessProject now benefits from core structural validation but performs no domain correctness checks. No npm package or cloud service is published by this release.
