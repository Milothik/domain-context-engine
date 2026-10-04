import { cases, arms } from "./harness.mjs";
import { scoreContext } from "./scoring.mjs";
const rows = [];
for (const fixture of cases)
  for (const [arm, payload] of Object.entries(await arms(fixture)))
    rows.push({
      caseId: fixture.id,
      arm,
      contextBytes: Buffer.byteLength(JSON.stringify(payload)),
      contextMetrics: scoreContext(payload, fixture.gold),
    });
console.log(
  JSON.stringify(
    {
      version: "2",
      mode: "offline-context-diagnostics",
      annotationSource:
        "manually authored gold in benchmarks/fixtures/cases.json",
      limitations:
        "Synthetic bounded fixtures. No model outputs or model superiority claim. Context metrics are distinct from output quality.",
      rows,
    },
    null,
    2,
  ),
);
