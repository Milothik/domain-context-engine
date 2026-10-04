# Architecture

## Boundaries

Raw materials → agent ingestion → versioned Domain Encyclopedia → CandidateRetriever → DecisionProvider → ContextCompiler → validated Task Context → GenerationProvider → OutputAdapter → output validation → approved state derivation → StateStore.

DomainEncyclopedia owns IDs and provenance. CandidateRetriever finds possibilities, never promises relevance. DecisionProvider must return one inspectable decision per candidate. ContextCompiler projects selected facts into the domain's task envelope. GenerationProvider is vendor independent. OutputAdapter shapes text, image, video, code, document, game asset or multimodal results. ProjectAdapter validates domain facts and derives approved state. StateStore uses optimistic version checks.

## Debt and scalability risks

The reference encyclopedia scans memory and clones JSON; use indexed immutable revisions and bounded graph/lexical retrieval at scale. The compiler carries complete selected attributes: a production domain compiler must project fields and estimate model tokens. Byte budgets fail closed and never silently discard constraints. Memory state is process local, with no durable run ledger; use transactional storage, idempotency keys and an outbox for external generation effects. A failed state commit may occur after generation: retain the output and reconcile rather than blindly generating again. Providers need timeouts, bounded retries, cancellation, redaction, usage budgets and validated evidence. Confidence cannot establish scientific validity.

## Decisions

TypeScript keeps contracts explicit; Ajv validates JSON Schema; no agent framework or provider SDK is required. Deterministic reference behavior is easy to reproduce. Preserve source locators, source snapshots/hashes, ontology revisions, provider/model revisions and compiler revisions in production run manifests. The demo records encyclopedia, provider and state versions, but does not implement a complete archival manifest.

Human include/exclude and field locks override automatic selection; contradictory human requests fail with a specific error. Additive rule overrides avoid silently removing canon. Intentional canon replacement belongs in a reviewed encyclopedia revision; output requirements are replaceable per task. Every generated output is untrusted until ProjectAdapter validation and review policy allow state derivation.

## Repository responsibilities

src/ is minimal framework code; schemas/ contains exchange envelopes; docs/ teaches implementation; examples/ contains invented fixtures and executable adaptations; templates/ provides starting points; tests/ checks architecture; benchmarks/ measures payloads without invented model results. No raw private material is included.
