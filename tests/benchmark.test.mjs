import test from "node:test";
import assert from "node:assert/strict";
import { cases, arms } from "../benchmarks/harness.mjs";
import { scoreContext, scoreOutput } from "../benchmarks/scoring.mjs";
test("independent gold covers three domains and detects missing constraints/facts/state", async () => {
  assert.equal(cases.length, 3);
  for (const fixture of cases) {
    const variants = await arms(fixture);
    const m = scoreContext(variants.compiled, fixture.gold);
    assert.equal(m.entityRecall, 1);
    assert.equal(m.entityPrecision, 1);
    assert.equal(m.constraintRecall, 1);
    assert.equal(m.factAccuracy, 1);
    assert.equal(m.continuityAccuracy, 1);
    assert.equal(m.irrelevantStateEntities, 0);
    const corrupt = structuredClone(variants.compiled);
    corrupt.constraints = { must: [], mustNot: [] };
    corrupt.entities = corrupt.entities.map((e) => ({
      ...e,
      attributes: {},
      rules: { mustPreserve: [], avoid: [] },
    }));
    corrupt.continuity = [];
    const bad = scoreContext(corrupt, fixture.gold);
    assert(bad.constraintRecall < 1);
    assert(bad.factAccuracy < 1);
    if (fixture.gold.continuity.length) assert(bad.continuityAccuracy < 1);
    assert(
      scoreContext(variants.encyclopediaDump, fixture.gold).entityPrecision < 1,
    );
  }
});
test("output rubric checks facts and ignores missing model evaluation rather than fabricating it", () => {
  const gold = cases[0].gold;
  assert.throws(() => scoreOutput({}, gold), /envelope/);
  const incomplete = {
    entities: [],
    constraints: { must: [], mustNot: [] },
    continuity: [],
  };
  assert.equal(scoreOutput(incomplete, gold).allGoldChecksPass, false);
});
