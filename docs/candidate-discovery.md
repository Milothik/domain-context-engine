# candidate discovery

StructuredRetriever uses explicit IDs, one-hop graph links, names and required type tags. It intentionally discovers associations that may be rejected. Replace it with indexed lexical, graph or embedding retrieval when scale requires. Human include/locks add candidates even when retrieval misses them. Bound fan-out and measure candidate recall separately from selection precision.
