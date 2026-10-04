# adapters

Keep GenerationProvider separate from OutputAdapter: one calls a model, the other shapes its result for text, image, video, code, document, web app, game asset or multimodal use. Store media references in JSON; do not pretend the offline preview produces media. ProjectAdapter validates both context and output and derives state. Implement domain-specific validity checks and approval gates; schemas alone cannot verify canon or factual claims.
