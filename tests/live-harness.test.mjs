import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

test("live runner performs all four arms over local HTTP and records actual failures in quality", async () => {
  let calls = 0;
  const server = http.createServer(async (req, res) => {
    calls++;
    let body = "";
    for await (const chunk of req) body += chunk;
    const request = JSON.parse(body),
      payload = JSON.parse(request.messages[1].content);
    const value = payload.candidates
      ? {
          decisions: payload.candidates.map((c) => ({
            candidate: c.entity["@id"],
            selected: payload.task.entityIds.includes(c.entity["@id"]),
            reason: "Local transport fixture only",
            materialEffects: ["identity"],
            confidence: 1,
          })),
        }
      : {
          entities: [],
          constraints: { must: [], mustNot: [] },
          continuity: [],
        };
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        id: "local-test",
        model: "fixture",
        choices: [
          {
            finish_reason: "stop",
            message: { content: JSON.stringify(value) },
          },
        ],
      }),
    );
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const { stdout } = await promisify(execFile)(
      process.execPath,
      ["benchmarks/live.mjs"],
      {
        cwd: fileURLToPath(new URL("../", import.meta.url)),
        env: {
          ...process.env,
          ALLOW_LIVE_EVAL: "1",
          DECISION_MODEL: "local-test",
          DECISION_ENDPOINT:
            "http://127.0.0.1:" + server.address().port + "/chat/completions",
          DECISION_API_KEY: "",
        },
        timeout: 15000,
      },
    );
    const summary = JSON.parse(stdout.trim());
    assert.equal(calls, 15);
    assert.equal(summary.completed, 12);
    assert.equal(summary.failures, 0);
    const report = JSON.parse(
      fs.readFileSync(new URL("../" + summary.report, import.meta.url), "utf8"),
    );
    assert.equal(report.rows.length, 12);
    assert(
      report.rows.every((r) => r.outputMetrics.allGoldChecksPass === false),
    );
    assert.equal(report.fixtureHash.length, 64);
    assert.equal(report.scorerHash.length, 64);
    assert(report.rows.every((r) => r.input && r.provider.model === "fixture"));
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
