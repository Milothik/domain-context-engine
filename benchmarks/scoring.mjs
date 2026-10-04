const equality = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const fraction = (passed, total) => (total ? passed / total : 1);
// Gold annotations are supplied independently; never read rules from the compiled arm.
export function scoreContext(packet, gold) {
  const entities = packet.entities ?? [],
    ids = new Set(entities.map((e) => e["@id"]));
  const declaredMust = packet.constraints?.must ?? packet.task?.must ?? [],
    declaredNot = packet.constraints?.mustNot ?? packet.task?.mustNot ?? [];
  const must = new Set([
      ...declaredMust,
      ...entities.flatMap((e) => e.rules?.mustPreserve ?? []),
    ]),
    mustNot = new Set([
      ...declaredNot,
      ...entities.flatMap((e) => e.rules?.avoid ?? []),
    ]);
  const state = packet.continuity ?? packet.state?.facts ?? [];
  const facts = gold.facts.filter((f) =>
    equality(
      entities.find((e) => e["@id"] === f.entityId)?.attributes?.[f.field],
      f.value,
    ),
  ).length;
  const continuity = gold.continuity.filter((f) =>
    equality(
      state.find((s) => s.entityId === f.entityId)?.value?.[f.field],
      f.value,
    ),
  ).length;
  const relevant = [...ids].filter((id) => gold.entityIds.includes(id)).length;
  return {
    entityRecall: fraction(relevant, gold.entityIds.length),
    entityPrecision: fraction(relevant, ids.size),
    constraintRecall: fraction(
      gold.must.filter((r) => must.has(r)).length +
        gold.mustNot.filter((r) => mustNot.has(r)).length,
      gold.must.length + gold.mustNot.length,
    ),
    factAccuracy: fraction(facts, gold.facts.length),
    continuityAccuracy: fraction(continuity, gold.continuity.length),
    irrelevantEntities: [...ids].filter((id) => !gold.entityIds.includes(id))
      .length,
    irrelevantStateEntities: state.filter(
      (f) => !gold.entityIds.includes(f.entityId),
    ).length,
  };
}
export function scoreOutput(output, gold) {
  if (
    !output ||
    !Array.isArray(output.entities) ||
    !Array.isArray(output.continuity) ||
    !output.constraints ||
    !Array.isArray(output.constraints.must) ||
    !Array.isArray(output.constraints.mustNot)
  )
    throw Error("Output does not match evaluation envelope");
  const context = {
    entities: output.entities.map((e) => ({
      "@id": e.id,
      attributes: e.attributes ?? {},
    })),
    constraints: output.constraints,
    continuity: output.continuity,
  };
  const metrics = scoreContext(context, gold);
  return {
    ...metrics,
    allGoldChecksPass:
      metrics.entityRecall === 1 &&
      metrics.entityPrecision === 1 &&
      metrics.constraintRecall === 1 &&
      metrics.factAccuracy === 1 &&
      metrics.continuityAccuracy === 1 &&
      metrics.irrelevantStateEntities === 0,
  };
}
