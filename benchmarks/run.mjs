import fs from "node:fs";
import * as c from "../dist/index.js";
import { options, read } from "../examples/run.mjs";
const o = options(),
  task = read("weirdway/task.json");
const candidates = await o.retriever.retrieve(task, o.encyclopedia);
const compiled = await c.run(o, task);
const variants = {
  rawPrompt: task.prompt,
  encyclopediaDump: {
    task,
    entities: o.encyclopedia.all(),
    state: await o.state.read(),
  },
  retrievalOnly: { task, entities: candidates.map((x) => x.entity) },
  compiled: compiled.context,
};
const required = [
  ...task.must,
  ...task.mustNot,
  ...compiled.context.entities.flatMap((e) => [
    ...e.rules.mustPreserve,
    ...e.rules.avoid,
  ]),
];
const rows = Object.entries(variants).map(([variant, payload]) => {
  const serialized = JSON.stringify(payload);
  return {
    variant,
    contextBytes: Buffer.byteLength(serialized),
    literalConstraintCoverage:
      required.filter((x) => serialized.includes(x)).length / required.length,
    irrelevantEntityMentions: serialized.includes("demo:bakery") ? 1 : 0,
    entityConsistency: null,
    continuity: null,
    outputCorrectness: null,
  };
});
console.log(
  JSON.stringify(
    {
      fixture: "synthetic-weirdway-v1",
      notes:
        "Measured payload properties only. No model quality or superiority claims.",
      rows,
    },
    null,
    2,
  ),
);
