import fs from "node:fs";
const schemas = {
  entity: "entity",
  task: "task",
  context: "task-context",
  decisions: "decision-result",
  state: "state",
  overrides: "overrides",
};
fs.writeFileSync(
  new URL("../src/core/schemas.ts", import.meta.url),
  Object.entries(schemas)
    .map(
      ([name, file]) =>
        "export const " +
        name +
        "Schema = " +
        JSON.stringify(
          JSON.parse(
            fs.readFileSync(
              new URL("../schemas/" + file + ".schema.json", import.meta.url),
              "utf8",
            ),
          ),
          null,
          2,
        ) +
        " as const;",
    )
    .join("\n") + "\n",
);
