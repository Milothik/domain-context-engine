# Context compiler v2

CompactContextCompiler defaults to user-canon only. fieldProvenance overrides entity-level provenance for individual attributes, rules or relationships. Withheld attributes and continuity are recorded as knowledgeWarnings. Unapproved hard rules fail for review instead of silently disappearing. Human field locks add explicit human-override provenance and do not promote other uncertain fields.

Constraint arrays remain for compatibility; constraintDetails preserve kind, source and priority (human 0, task 1, entity hard rules 2, variation 3). Duplicated text retains all origins in the details. Priority does not override conflicting canon. Exact predicates normalized by whitespace/case cannot appear in both must and mustNot; broader semantic conflicts need domain validation.

At a byte limit, optional selected entities are removed in increasing confidence × (1 + material-effect count), with stable ID ties. Task IDs, required types, included/locked entities and entities supplying hard rules are protected. Omissions are explicit. If protected knowledge does not fit, generation fails; it never truncates hard facts. The engine rechecks schema, hard-rule preservation and human overrides even for a custom compiler. Domain projections should retain essential fields and implement model-specific token budgeting.
