import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import * as c from "../dist/index.js";
import { options, read } from "../examples/run.mjs";
test("material effects do not leak through unrelated downstream links", async () => {
  const book = new c.MemoryEncyclopedia("edges", [
    entity("root", {
      relationships: [
        { to: "place", type: "located-at", materialEffects: ["continuity"] },
      ],
    }),
    entity("place", { relationships: ["noise"] }),
    entity("noise"),
  ]);
  const candidates = await new c.StructuredRetriever().retrieve(task, book);
  const decisions = await new c.DeterministicDecisionProvider().select({
    task,
    candidates,
    currentState: { version: 0, facts: [] },
  });
  assert(decisions.find((d) => d.candidate === "place").selected);
  assert.equal(decisions.find((d) => d.candidate === "noise").selected, false);
});
test("unapproved relationship effects cannot force deterministic selection", async () => {
  const book = new c.MemoryEncyclopedia("edges", [
    entity("root", {
      relationships: [
        { to: "noise", type: "located-at", materialEffects: ["continuity"] },
      ],
      fieldProvenance: { relationships: p("inferred") },
    }),
    entity("noise"),
  ]);
  const candidates = await new c.StructuredRetriever().retrieve(task, book);
  assert(
    candidates
      .find((d) => d.entity["@id"] === "noise")
      .signals.includes("unapproved-edge"),
  );
  const decisions = await new c.DeterministicDecisionProvider().select({
    task,
    candidates,
    currentState: { version: 0, facts: [] },
  });
  assert.equal(decisions.find((d) => d.candidate === "noise").selected, false);
});
test("custom compiler cannot drop a selected task entity while keeping a valid envelope", async () => {
  const o = setup([entity("root")]);
  o.compiler = {
    async compile(input) {
      return new c.CompactContextCompiler().compile({ ...input, selected: [] });
    },
  };
  await assert.rejects(c.run(o, task), /mandatory selected entity/);
});
test("non-finite, cyclic and non-JSON provider values fail at core boundary", () => {
  assert.throws(() => c.validateJson({ x: NaN }), /finite JSON/);
  const cyclic = {};
  cyclic.self = cyclic;
  assert.throws(() => c.validateJson(cyclic), /Cyclic/);
  assert.throws(() => c.validateJson({ x: undefined }), /finite JSON/);
});
const p = (type = "user-canon", source = "fixture") => [
  { source, type, confidence: 1 },
];
const entity = (id, extras = {}) => ({
  "@id": id,
  "@type": "Thing",
  name: id,
  attributes: { label: id },
  relationships: [],
  rules: { mustPreserve: [], mayVary: [], avoid: [] },
  provenance: p(),
  ...extras,
});
const task = {
  id: "v2",
  prompt: "root",
  entityIds: ["root"],
  tags: [],
  must: [],
  mustNot: [],
  outputRequirements: {},
};
const setup = (entities) => ({
  ...options(),
  encyclopedia: new c.MemoryEncyclopedia("v2-test", entities),
  state: new c.MemoryStateStore(),
  project: c.statelessProject,
});
test("state merges fields, nested patches and multiple updates for one entity", async () => {
  const s = new c.MemoryStateStore({
    version: 0,
    facts: [
      {
        entityId: "root",
        value: { leftSleeve: "torn", outfit: { coat: "yellow", hat: "black" } },
        provenance: p(),
      },
    ],
  });
  await s.commit(0, [
    {
      entityId: "root",
      value: { location: "station", outfit: { hat: "red" } },
      provenance: p("generated", "update"),
    },
    { entityId: "root", value: { injury: false }, provenance: p() },
  ]);
  const f = (await s.read()).facts[0];
  assert.equal(f.value.leftSleeve, "torn");
  assert.deepEqual(f.value.outfit, { coat: "yellow", hat: "red" });
  assert.equal(f.value.location, "station");
  assert.equal(f.value.injury, false);
  assert.equal(f.fieldProvenance.leftSleeve[0].type, "user-canon");
  assert(f.fieldProvenance.outfit.some((x) => x.type === "generated"));
});
test("invalid state update is atomic", async () => {
  const s = new c.MemoryStateStore();
  await assert.rejects(
    s.commit(0, [
      { entityId: "root", value: { a: 1 }, provenance: p() },
      { entityId: "bad", value: { b: 2 }, provenance: [] },
    ]),
    /schema/,
  );
  assert.deepEqual(await s.read(), { version: 0, facts: [] });
});
test("typed two-hop retrieval ranks and bounds cyclic graph", async () => {
  const book = new c.MemoryEncyclopedia("v2", [
    entity("root", {
      relationships: [
        { to: "place", type: "located-at", materialEffects: ["continuity"] },
        "noise",
      ],
    }),
    entity("place", {
      relationships: [
        { to: "rule", type: "governed-by", materialEffects: ["constraints"] },
        { to: "root", type: "back" },
      ],
    }),
    entity("rule"),
    entity("noise"),
  ]);
  const found = await new c.StructuredRetriever({ maxDepth: 2 }).retrieve(
    task,
    book,
  );
  assert.equal(found[0].entity["@id"], "root");
  assert.equal(found.find((x) => x.entity["@id"] === "rule").depth, 2);
  assert(found.find((x) => x.entity["@id"] === "rule").paths[0].length === 2);
  assert.equal(found.length, 4);
  const selected = await new c.DeterministicDecisionProvider().select({
    task,
    candidates: found,
    currentState: { version: 0, facts: [] },
  });
  assert(selected.find((d) => d.candidate === "place").selected);
  assert(selected.find((d) => d.candidate === "rule").selected);
  assert.equal(selected.find((d) => d.candidate === "noise").selected, false);
});
test("candidate cap cannot lose required seeds", async () => {
  const book = new c.MemoryEncyclopedia("v2", [
    entity("root"),
    entity("other"),
  ]);
  await assert.rejects(
    new c.StructuredRetriever({ maxCandidates: 1 }).retrieve(
      { ...task, entityIds: ["root", "other"] },
      book,
    ),
    /required seeds/,
  );
});
test("core validates context with statelessProject and custom compiler", async () => {
  const o = setup([entity("root")]);
  o.compiler = {
    async compile() {
      return {};
    },
  };
  await assert.rejects(c.run(o, task), /context schema/);
});
test("core catches mandatory constraint loss from a schema-valid compiler", async () => {
  const o = setup([entity("root")]),
    base = o.compiler;
  o.compiler = {
    async compile(input) {
      const out = await base.compile(input);
      out.constraints.must = [];
      out.constraintDetails = [];
      return out;
    },
  };
  await assert.rejects(
    c.run(o, { ...task, must: ["keep coat"] }),
    /dropped mandatory/,
  );
});
test("core validates material effects element types", async () => {
  const o = setup([entity("root")]);
  o.decision = new c.CallbackDecisionProvider("invalid", async () => [
    {
      candidate: "root",
      selected: true,
      reason: "bad",
      materialEffects: [42],
      confidence: 1,
    },
  ]);
  await assert.rejects(c.run(o, task), /decisions schema/);
});
test("uncertain claims and generated continuity are not silently canon", async () => {
  const o = setup([
    entity("root", {
      attributes: { coat: "yellow", rumor: "red" },
      fieldProvenance: { rumor: p("uncertain") },
    }),
  ]);
  o.state = new c.MemoryStateStore({
    version: 0,
    facts: [
      {
        entityId: "root",
        value: { injury: "invented" },
        provenance: p("generated"),
      },
    ],
  });
  const r = await c.run(o, task);
  assert.equal(r.context.entities[0].attributes.coat, "yellow");
  assert(!("rumor" in r.context.entities[0].attributes));
  assert.equal(r.context.continuity.length, 0);
  assert.equal(r.context.knowledgeWarnings.length, 2);
});
test("human lock supplies its own provenance without promoting other fields", async () => {
  const o = setup([
    entity("root", {
      attributes: { coat: "red", mood: "angry" },
      provenance: p("generated"),
    }),
  ]);
  const r = await c.run(o, task, { locks: { root: { coat: "yellow" } } });
  assert.deepEqual(r.context.entities[0].attributes, { coat: "yellow" });
  assert.equal(
    r.context.entities[0].fieldProvenance.coat[0].type,
    "user-canon",
  );
});
test("unapproved hard rules require review rather than disappearing", async () => {
  const o = setup([
    entity("root", {
      provenance: p("uncertain"),
      rules: { mustPreserve: ["do x"], mayVary: [], avoid: [] },
    }),
  ]);
  await assert.rejects(c.run(o, task), /Unapproved hard/);
});
test("constraint conflicts fail and priority retains origins", async () => {
  const o = setup([
    entity("root", {
      rules: { mustPreserve: ["Keep coat"], mayVary: [], avoid: [] },
    }),
  ]);
  await assert.rejects(
    c.run(o, { ...task, mustNot: [" keep   COAT "] }),
    /Constraint conflict/,
  );
  const r = await c.run(
    o,
    { ...task, must: ["Task rule"] },
    { rules: { must: ["Human rule"] } },
  );
  assert.deepEqual(
    r.context.constraintDetails.map((d) => d.source),
    ["human-override", "task:v2", "root"],
  );
});
test("budget pruning uses confidence and effects while keeping mandatory context", async () => {
  const compiler = new c.CompactContextCompiler(),
    selected = [
      entity("root"),
      entity("low", { attributes: { blob: "x".repeat(4000) } }),
      entity("high", { attributes: { blob: "x".repeat(200) } }),
    ];
  const input = {
    task,
    selected,
    currentState: { version: 0, facts: [] },
    overrides: {},
    decisions: [
      {
        candidate: "low",
        selected: true,
        reason: "weak",
        materialEffects: ["style"],
        confidence: 0.1,
      },
      {
        candidate: "high",
        selected: true,
        reason: "strong",
        materialEffects: ["style", "identity"],
        confidence: 0.9,
      },
    ],
  };
  const full = await compiler.compile(input);
  const limited = await compiler.compile({
    ...input,
    maxContextBytes: Buffer.byteLength(JSON.stringify(full)) - 3500,
  });
  assert.deepEqual(limited.omittedEntityIds, ["low"]);
  assert(limited.entities.some((e) => e["@id"] === "root"));
  assert(limited.entities.some((e) => e["@id"] === "high"));
});
test("JSON schema files agree with exported runtime validators", () => {
  c.validateEntity(read("weirdway/entities.json")[0]);
  assert.throws(
    () =>
      c.validateEntity({
        ...read("weirdway/entities.json")[0],
        relationships: [{ to: "x" }],
      }),
    /schema/,
  );
});
async function server(handler) {
  const s = http.createServer(handler);
  await new Promise((resolve) => s.listen(0, "127.0.0.1", resolve));
  return {
    endpoint: "http://127.0.0.1:" + s.address().port + "/chat/completions",
    close: () => new Promise((resolve) => s.close(resolve)),
  };
}
const wire = (decisions) => ({
  id: "fixture-response",
  model: "local-fixture",
  usage: { total_tokens: 12 },
  choices: [
    {
      finish_reason: "stop",
      message: { content: JSON.stringify({ decisions }) },
    },
  ],
});
test("LLM provider executes real HTTP transport, scopes state and validates reply", async () => {
  let request;
  const s = await server(async (req, res) => {
    let body = "";
    for await (const chunk of req) body += chunk;
    request = JSON.parse(body);
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify(
        wire([
          {
            candidate: "root",
            selected: true,
            reason: "Appears in task",
            materialEffects: ["identity"],
            confidence: 0.9,
          },
        ]),
      ),
    );
  });
  try {
    const provider = new c.ChatCompletionsDecisionProvider({
      endpoint: s.endpoint,
      model: "fixture",
    });
    const result = await provider.select({
      task,
      candidates: [{ entity: entity("root"), signals: ["explicit-id"] }],
      currentState: {
        version: 0,
        facts: [
          {
            entityId: "private-other",
            value: { secret: "do not send" },
            provenance: p(),
          },
        ],
      },
    });
    assert.equal(result[0].selected, true);
    assert(!JSON.stringify(request).includes("private-other"));
    assert.equal(result[0].evidence.transport.responseId, "fixture-response");
    assert.equal(request.response_format.type, "json_object");
  } finally {
    await s.close();
  }
});
test("LLM rejects malformed or incomplete decisions and does not fall back", async () => {
  const s = await server((req, res) => res.end(JSON.stringify(wire([]))));
  try {
    await assert.rejects(
      new c.ChatCompletionsDecisionProvider({
        endpoint: s.endpoint,
        model: "fixture",
      }).select({
        task,
        candidates: [{ entity: entity("root"), signals: [] }],
        currentState: { version: 0, facts: [] },
      }),
      /exactly once/,
    );
  } finally {
    await s.close();
  }
});
test("LLM timeout, request cap, truncation and HTTP failure fail closed", async () => {
  const fake = async () =>
    new Response(
      JSON.stringify({
        choices: [{ finish_reason: "length", message: { content: "{}" } }],
      }),
    );
  const payload = {
    task,
    candidates: [{ entity: entity("root"), signals: [] }],
    currentState: { version: 0, facts: [] },
  };
  await assert.rejects(
    new c.ChatCompletionsDecisionProvider({
      endpoint: "http://localhost/x",
      model: "fixture",
      fetch: fake,
    }).select(payload),
    /truncated/,
  );
  await assert.rejects(
    new c.ChatCompletionsDecisionProvider({
      endpoint: "http://localhost/x",
      model: "fixture",
      maxRequestBytes: 1,
      fetch: fake,
    }).select(payload),
    /request budget/,
  );
  await assert.rejects(
    new c.ChatCompletionsDecisionProvider({
      endpoint: "http://localhost/x",
      model: "fixture",
      fetch: async () => new Response("private error details", { status: 429 }),
    }).select(payload),
    /^Error: LLM HTTP status 429$/,
  );
  const s = await server(() => {});
  try {
    await assert.rejects(
      new c.ChatCompletionsDecisionProvider({
        endpoint: s.endpoint,
        model: "fixture",
        timeoutMs: 20,
      }).select(payload),
      /timeout/,
    );
  } finally {
    await s.close();
  }
});
test("LLM response budget is enforced", async () => {
  const client = new c.ChatCompletionsClient({
    endpoint: "http://localhost/x",
    model: "fixture",
    maxResponseBytes: 5,
    fetch: async () => new Response("xxxxxxxxxx"),
  });
  await assert.rejects(client.complete("JSON", {}), /response budget/);
});
test("reviewed scalar state replacement does not inherit generated field status", async () => {
  const s = new c.MemoryStateStore({
    version: 0,
    facts: [
      {
        entityId: "root",
        value: { coat: "red", injury: "unknown" },
        provenance: p("generated"),
      },
    ],
  });
  await s.commit(0, [
    { entityId: "root", value: { coat: "yellow" }, provenance: p() },
  ]);
  const f = (await s.read()).facts[0];
  assert.deepEqual(f.fieldProvenance.coat, p());
  assert.equal(f.fieldProvenance.injury[0].type, "generated");
});
test("custom compiler cannot mutate selected canon to bypass constraint preservation", async () => {
  const o = setup([
    entity("root", {
      rules: { mustPreserve: ["Protect invariant"], mayVary: [], avoid: [] },
    }),
  ]);
  o.compiler = {
    async compile(input) {
      input.selected[0].rules.mustPreserve = [];
      return new c.CompactContextCompiler().compile(input);
    },
  };
  await assert.rejects(c.run(o, task), /dropped mandatory/);
});
test("commit conflict preserves validated output for recovery", async () => {
  const o = setup([entity("root")]);
  o.state = {
    async read() {
      return { version: 0, facts: [] };
    },
    async commit() {
      throw Error("concurrent update");
    },
  };
  o.project = {
    ...c.statelessProject,
    async deriveState() {
      return [
        { entityId: "root", value: { location: "station" }, provenance: p() },
      ];
    },
  };
  try {
    await c.run(o, task);
    assert.fail("must throw");
  } catch (err) {
    assert(err instanceof c.StateCommitError);
    assert.equal(err.output.kind, "preview");
    assert.equal(err.context.task.id, "v2");
    assert.equal(err.cause.message, "concurrent update");
  }
});
test("domain validation hooks cannot mutate generated context", async () => {
  const o = setup([entity("root")]);
  o.project = {
    ...c.statelessProject,
    validateContext(context) {
      context.entities = [];
    },
    validateOutput(output, context) {
      context.constraints.must.push("Injected");
    },
  };
  const r = await c.run(o, task);
  assert.equal(r.context.entities.length, 1);
  assert(!r.context.constraints.must.includes("Injected"));
});
test("custom compiler cannot discard human include/lock overrides", async () => {
  const o = setup([entity("root"), entity("other")]);
  o.compiler = {
    async compile(input) {
      return new c.CompactContextCompiler().compile({
        ...input,
        overrides: {},
        selected: input.selected.filter((e) => e["@id"] === "root"),
      });
    },
  };
  await assert.rejects(
    c.run(o, task, { include: ["other"] }),
    /human selection/,
  );
});
test("derived state cannot update irrelevant entities", async () => {
  const o = setup([entity("root"), entity("other")]);
  o.project = {
    ...c.statelessProject,
    async deriveState() {
      return [{ entityId: "other", value: { x: 1 }, provenance: p() }];
    },
  };
  await assert.rejects(c.run(o, task), /outside compiled/);
  assert.equal((await o.state.read()).version, 0);
});
