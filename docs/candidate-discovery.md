# Ranked candidate discovery

StructuredRetriever assigns seed/type/lexical scores and explores outgoing typed relationships up to maxDepth (default 2, range 0–8). Name-token coverage uses Unicode letters/numbers. Seeds score 100, required types 80, graph discoveries 60/depth, lexical matches up to 40. Ties use stable entity IDs. Candidate evidence includes score, depth, signals, bounded paths and declared effects.

maxCandidates defaults to 100. Explicit task IDs and required types cannot be silently removed by that cap; an insufficient budget fails. A relationTypes allowlist can limit traversal. Cycles terminate through visited IDs; alternate paths/effects discovered at the same traversal depth are recorded, with at most eight paths per candidate. Path evidence is bounded, not an exhaustive graph proof.

These scores are engineering policy, not calibrated relevance probabilities. Discovery does not decide: the decision provider judges consequences and rejects lexical-only/untyped associations unless a task seed/type or explicit material consequence requires them. Replace in-memory scans with an indexed backend for large graphs; current ranking/return bounds are not a strict bound on all traversal work.
