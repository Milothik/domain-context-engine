import {
  validateTask,
  validateState,
  validateOverrides,
  validateDecisions,
  validateContext,
  validateEntity,
  validateJson,
} from "./validation.js";
import type {
  DomainEncyclopedia,
  CandidateRetriever,
  DecisionProvider,
  ContextCompiler,
  GenerationProvider,
  OutputAdapter,
  StateStore,
  ProjectAdapter,
  Task,
  Overrides,
} from "./contracts.js";
import type { Json, TaskContext } from "./contracts.js";
export class StateCommitError extends Error {
  constructor(
    public output: Json,
    public context: TaskContext,
    cause: unknown,
  ) {
    super(
      "Validated output was generated but continuity commit failed; reconcile without blind regeneration",
      { cause },
    );
    this.name = "StateCommitError";
  }
}
export interface EngineOptions {
  encyclopedia: DomainEncyclopedia;
  retriever: CandidateRetriever;
  decision: DecisionProvider;
  compiler: ContextCompiler;
  generator: GenerationProvider;
  output: OutputAdapter;
  state: StateStore;
  project: ProjectAdapter;
  maxContextBytes?: number;
}
export async function run(
  options: EngineOptions,
  task: Task,
  overrides: Overrides = {},
  decisionProvider: DecisionProvider = options.decision,
) {
  const {
    encyclopedia,
    retriever,
    compiler,
    generator,
    output,
    state,
    project,
  } = options;
  validateTask(task);
  validateOverrides(overrides);
  if (
    !Number.isInteger(options.maxContextBytes ?? 65536) ||
    (options.maxContextBytes ?? 65536) < 1
  )
    throw Error("Context budget must be a positive integer");
  const currentState = await state.read();
  validateState(currentState);
  const include = new Set(overrides.include ?? []),
    exclude = new Set(overrides.exclude ?? []);
  for (const id of [
    ...include,
    ...exclude,
    ...Object.keys(overrides.locks ?? {}),
  ])
    if (!encyclopedia.get(id)) throw Error("Unknown override entity " + id);
  for (const id of include)
    if (exclude.has(id)) throw Error("Conflicting human overrides " + id);
  for (const id of Object.keys(overrides.locks ?? {}))
    if (exclude.has(id)) throw Error("Cannot lock excluded entity " + id);
    else include.add(id);
  const candidates = await retriever.retrieve(
    structuredClone(task),
    encyclopedia,
  );
  for (const id of include)
    if (!candidates.some((c) => c.entity["@id"] === id))
      candidates.push({
        entity: encyclopedia.get(id)!,
        signals: ["human-include"],
      });
  for (const c of candidates) {
    validateEntity(c.entity);
    const authoritative = encyclopedia.get(c.entity["@id"]);
    if (!authoritative) throw Error("Candidate absent from encyclopedia");
    c.entity = authoritative;
  }
  const candidateIds = new Set(candidates.map((c) => c.entity["@id"]));
  if (candidateIds.size !== candidates.length)
    throw Error("Duplicate candidates");
  const raw = await decisionProvider.select({
    task: structuredClone(task),
    candidates: structuredClone(candidates),
    currentState: structuredClone(currentState),
  });
  validateDecisions(raw, [...candidateIds]);
  const decisions = raw.map((d) =>
    include.has(d.candidate) || exclude.has(d.candidate)
      ? {
          ...d,
          selected: include.has(d.candidate),
          reason: "Human override",
          evidence: { providerDecision: JSON.parse(JSON.stringify(d)) },
        }
      : d,
  );
  const selected = candidates
    .filter((c) =>
      decisions.some((d) => d.candidate === c.entity["@id"] && d.selected),
    )
    .map((c) => c.entity);
  const context = await compiler.compile({
    task: structuredClone(task),
    selected: structuredClone(selected),
    currentState: structuredClone(currentState),
    overrides: structuredClone(overrides),
    decisions: structuredClone(decisions),
    maxContextBytes: options.maxContextBytes ?? 65536,
  });
  validateContext(context);
  const expectedMust = [
    ...task.must,
    ...selected.flatMap((e) => e.rules.mustPreserve),
    ...(overrides.rules?.must ?? []),
  ];
  const expectedMustNot = [
    ...task.mustNot,
    ...selected.flatMap((e) => e.rules.avoid),
    ...(overrides.rules?.mustNot ?? []),
  ];
  if (
    expectedMust.some((r) => !context.constraints.must.includes(r)) ||
    expectedMustNot.some((r) => !context.constraints.mustNot.includes(r))
  )
    throw Error("Compiler dropped mandatory constraints");
  if (
    context.entities.some((e) => !selected.some((s) => s["@id"] === e["@id"]))
  )
    throw Error("Compiler introduced unselected context");
  const compiledIds = new Set(context.entities.map((e) => e["@id"]));
  const protectedIds = selected
    .filter(
      (e) =>
        task.entityIds.includes(e["@id"]) ||
        task.tags.includes(e["@type"]) ||
        e.rules.mustPreserve.length ||
        e.rules.avoid.length,
    )
    .map((e) => e["@id"]);
  if (protectedIds.some((id) => !compiledIds.has(id)))
    throw Error("Compiler omitted mandatory selected entity");
  if (
    [...include].some((id) => !compiledIds.has(id)) ||
    [...exclude].some((id) => compiledIds.has(id))
  )
    throw Error("Compiler violated human selection override");
  for (const [id, fields] of Object.entries(overrides.locks ?? {}))
    for (const [field, value] of Object.entries(fields))
      if (
        JSON.stringify(
          context.entities.find((e) => e["@id"] === id)?.attributes[field],
        ) !== JSON.stringify(value)
      )
        throw Error("Compiler violated human field lock");
  if (
    Object.entries(overrides.outputRequirements ?? {}).some(
      ([field, value]) =>
        JSON.stringify(context.outputRequirements[field]) !==
        JSON.stringify(value),
    )
  )
    throw Error("Compiler violated human output override");
  project.validateContext(structuredClone(context));
  const contextBytes = new TextEncoder().encode(JSON.stringify(context)).length;
  if (contextBytes > (options.maxContextBytes ?? 65536))
    throw Error(
      "Context budget exceeded; refine domain projection instead of dropping hard constraints",
    );
  const generated = await generator.generate(structuredClone(context));
  validateJson(generated);
  const result = await output.adapt(generated, structuredClone(context));
  validateJson(result);
  project.validateOutput(structuredClone(result), structuredClone(context));
  const updates = await project.deriveState(
    structuredClone(result),
    structuredClone(context),
  );
  for (const update of updates) {
    validateState({ version: currentState.version, facts: [update] });
    if (!compiledIds.has(update.entityId))
      throw Error("State update targets entity outside compiled context");
  }
  if (updates.length)
    try {
      await state.commit(currentState.version, updates);
    } catch (cause) {
      throw new StateCommitError(
        structuredClone(result),
        structuredClone(context),
        cause,
      );
    }
  return {
    output: result,
    context,
    trace: {
      encyclopediaRevision: encyclopedia.revision,
      taskId: task.id,
      decisionProvider: decisionProvider.id,
      generationProvider: generator.id,
      stateVersion: currentState.version,
      overrides: structuredClone(overrides),
      decisions,
      compilerVersion: context.schemaVersion,
      omittedEntityIds: context.omittedEntityIds ?? [],
      knowledgeWarnings: context.knowledgeWarnings ?? [],
      contextBytes,
    },
  };
}
