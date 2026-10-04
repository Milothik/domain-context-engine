import test from "node:test";
import assert from "node:assert/strict";
import * as c from "../dist/index.js";
import { options, read } from "../examples/run.mjs";
const task = () => read("weirdway/task.json");
test("relevance, rejection, constraints, provenance and scoped continuity", async () => {
  const r = await c.run(options(), task());
  assert(
    r.trace.decisions.find((d) => d.candidate === "demo:yastrik").selected,
  );
  assert.equal(
    r.trace.decisions.find((d) => d.candidate === "demo:bakery").selected,
    false,
  );
  assert(r.context.constraints.must.includes("Yastrik wears a yellow coat"));
  assert(r.context.constraints.mustNot.includes("No new injury"));
  assert.equal(r.context.continuity.length, 1);
  assert.equal(r.context.continuity[0].value.leftSleeve, "torn");
  assert.deepEqual(
    r.context.entities[0].provenance,
    read("weirdway/entities.json")[0].provenance,
  );
});
test("deterministic reproducibility", async () =>
  assert.deepEqual(
    await c.run(options(), task()),
    await c.run(options(), task()),
  ));
test("provider replacement keeps contract and traces rejected context", async () => {
  const p = new c.CallbackDecisionProvider(
    "service-fixture",
    async ({ candidates }) =>
      candidates.map((x) => ({
        candidate: x.entity["@id"],
        selected: false,
        reason: "Fixture rejection",
        materialEffects: [],
        confidence: 0.8,
        evidence: { service: "fixture" },
      })),
  );
  const r = await c.run(options(), task(), {}, p);
  assert.equal(r.context.entities.length, 0);
  assert.equal(r.trace.decisionProvider, "service-fixture");
});
test("human includes, excludes, locks, rules and requirements win", async () => {
  const r = await c.run(options(), task(), {
    include: ["demo:bakery"],
    exclude: ["demo:yastrik"],
    locks: { "demo:station": { lighting: "sunrise" } },
    rules: { must: ["Approved extra rule"] },
    outputRequirements: { panels: 4 },
  });
  assert(!r.context.entities.some((e) => e["@id"] === "demo:yastrik"));
  assert(r.context.entities.some((e) => e["@id"] === "demo:bakery"));
  assert.equal(
    r.context.entities.find((e) => e["@id"] === "demo:station").attributes
      .lighting,
    "sunrise",
  );
  assert.equal(r.context.outputRequirements.panels, 4);
  assert(r.context.constraints.must.includes("Approved extra rule"));
});
test("conflicting overrides fail before generation", async () =>
  assert.rejects(
    c.run(options(), task(), {
      include: ["demo:yastrik"],
      exclude: ["demo:yastrik"],
    }),
    /Conflicting/,
  ));
test("schema rejects invalid compiler output", async () => {
  const o = options();
  o.compiler = {
    async compile() {
      return {};
    },
  };
  await assert.rejects(c.run(o, task()));
});
test("unknown decisions fail closed", async () => {
  const o = options();
  o.decision = new c.CallbackDecisionProvider("bad", async () => [
    {
      candidate: "missing",
      selected: true,
      reason: "x",
      confidence: 1,
      materialEffects: [],
    },
  ]);
  await assert.rejects(c.run(o, task()), /Invalid decision/);
});
test("failure never commits state; validated updates do", async () => {
  const o = options();
  o.generator = {
    id: "broken",
    async generate() {
      throw Error("failed");
    },
  };
  await assert.rejects(c.run(o, task()));
  assert.equal((await o.state.read()).version, 1);
  o.generator = new c.PreviewGenerationProvider();
  o.project = {
    ...o.project,
    async deriveState() {
      return [
        {
          entityId: "demo:yastrik",
          value: { approved: true },
          provenance: [{ source: "review", type: "user-canon", confidence: 1 }],
        },
      ];
    },
  };
  await c.run(o, task());
  assert.equal((await o.state.read()).version, 2);
});
test("optimistic state versions prevent lost writes", async () => {
  const s = new c.MemoryStateStore();
  await s.commit(0, []);
  await assert.rejects(s.commit(0, []), /version conflict/);
});
test("context overflow fails rather than truncating constraints", async () => {
  const o = options();
  o.maxContextBytes = 1;
  await assert.rejects(c.run(o, task()), /budget/);
});
test("second domain runs same engine", async () => {
  const r = await c.run(
    options("product-brand"),
    read("product-brand/task.json"),
  );
  assert.equal(r.output.kind, "copy-brief");
  assert.equal(r.context.outputRequirements.tone, "plain and warm");
});
