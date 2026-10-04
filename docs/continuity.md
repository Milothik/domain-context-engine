# State and continuity v2

MemoryStateStore applies validated atomic patch batches with optimistic versions. Object fields recursively merge; arrays, scalars and null replace; absent fields survive. Multiple patches for one entity apply in order. The snapshot still contains one consolidated entity record with many independent value fields.

Per-field provenance prevents an untouched sleeve injury from acquiring the provenance of a generated location patch. Nested object merges conservatively aggregate provenance at the top-level field. Snapshot-level provenance preserves contributing sources; scalar replacements use their new field source. No implicit delete behavior exists.

Only state for retained context entities and approved fields enters generation. Engine-derived updates must target entities in the compiled context. Failures before successful validation never commit. A post-generation commit failure throws StateCommitError with output/context for reconciliation. Storage remains process-local: production deployments must add durable transactions, idempotency, tenant authorization and crash recovery.
