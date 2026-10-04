# continuity

State is optional. MemoryStateStore returns snapshots and merges approved entity facts with optimistic version checks. The compiler includes facts only for selected IDs. Multi-session deployments need durable storage, tenant isolation, transactional updates and a generation idempotency ledger. Facts can be generated or inferred, but must retain those labels until approved. A state conflict requires reconciliation and must not trigger automatic duplicate generation.
