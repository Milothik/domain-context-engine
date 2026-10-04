import fs from "node:fs";
import { pathToFileURL } from "node:url";
import Ajv from "ajv";
import * as core from "../dist/index.js";
export const read = (p) =>
  JSON.parse(fs.readFileSync(new URL(p, import.meta.url), "utf8"));
const validate = new Ajv({ strict: true }).compile(
  read("../schemas/task-context.schema.json"),
);
export function options(domain = "weirdway") {
  return {
    encyclopedia: new core.MemoryEncyclopedia(
      "synthetic-v1",
      read(domain + "/entities.json"),
    ),
    retriever: new core.StructuredRetriever(),
    decision: new core.DeterministicDecisionProvider(),
    compiler:
      domain === "product-brand"
        ? new BrandCompiler()
        : new core.CompactContextCompiler(),
    generator: new core.PreviewGenerationProvider(),
    output:
      domain === "product-brand"
        ? new BrandOutput()
        : new core.JsonOutputAdapter(),
    state: new core.MemoryStateStore(
      domain === "weirdway" ? read("weirdway/state.json") : undefined,
    ),
    project: {
      ...core.statelessProject,
      validateContext(c) {
        if (!validate(c)) throw Error(JSON.stringify(validate.errors));
      },
    },
  };
}
class BrandCompiler extends core.CompactContextCompiler {
  async compile(input) {
    const c = await super.compile(input);
    c.outputRequirements = { ...c.outputRequirements, tone: "plain and warm" };
    return c;
  }
}
class BrandOutput {
  async adapt(output, context) {
    return {
      kind: "copy-brief",
      requirements: context.outputRequirements,
      preview: output,
    };
  }
}
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url)
  for (const domain of ["weirdway", "product-brand"]) {
    const result = await core.run(options(domain), read(domain + "/task.json"));
    console.log(JSON.stringify({ domain, ...result }, null, 2));
  }
