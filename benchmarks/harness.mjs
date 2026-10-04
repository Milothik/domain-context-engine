import fs from "node:fs";
import * as c from "../dist/index.js";
export const cases = JSON.parse(
  fs.readFileSync(new URL("./fixtures/cases.json", import.meta.url), "utf8"),
);
export async function arms(
  fixture,
  decision = new c.DeterministicDecisionProvider(),
) {
  const encyclopedia = new c.MemoryEncyclopedia(
      "eval-fixtures-v2",
      fixture.entities,
    ),
    retriever = new c.StructuredRetriever({ maxDepth: 2 });
  const candidates = await retriever.retrieve(fixture.task, encyclopedia);
  const run = await c.run(
    {
      encyclopedia,
      retriever,
      decision,
      compiler: new c.CompactContextCompiler(),
      generator: new c.PreviewGenerationProvider(),
      output: new c.JsonOutputAdapter(),
      state: new c.MemoryStateStore(fixture.state),
      project: c.statelessProject,
    },
    fixture.task,
  );
  return {
    rawPrompt: { task: fixture.task },
    encyclopediaDump: {
      task: fixture.task,
      entities: fixture.entities,
      state: fixture.state,
    },
    retrievalOnly: {
      task: fixture.task,
      entities: candidates.map((c) => c.entity),
      state: fixture.state,
    },
    compiled: run.context,
  };
}
