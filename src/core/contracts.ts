export type Json =
  | null
  | boolean
  | number
  | string
  | Json[]
  | { [key: string]: Json };
export interface Provenance {
  source: string;
  type: "user-canon" | "inferred" | "generated" | "external" | "uncertain";
  confidence: number;
  locator?: string;
}
export interface Relationship {
  to: string;
  type: string;
  materialEffects?: string[];
}
export interface ConstraintDetail {
  text: string;
  kind: "must" | "mustNot" | "may";
  source: string;
  priority: number;
}
export interface KnowledgeWarning {
  entityId: string;
  field: string;
  reason: string;
  provenance: Provenance[];
}
export interface Entity {
  "@id": string;
  "@type": string;
  name: string;
  attributes: Record<string, Json>;
  relationships: (string | Relationship)[];
  fieldProvenance?: Record<string, Provenance[]>;
  rules: { mustPreserve: string[]; mayVary: string[]; avoid: string[] };
  provenance: Provenance[];
}
export interface Task {
  id: string;
  prompt: string;
  entityIds: string[];
  tags: string[];
  must: string[];
  mustNot: string[];
  outputRequirements: Record<string, Json>;
}
export interface Overrides {
  include?: string[];
  exclude?: string[];
  locks?: Record<string, Record<string, Json>>;
  rules?: { must?: string[]; mustNot?: string[] };
  outputRequirements?: Record<string, Json>;
}
export interface StateFact {
  fieldProvenance?: Record<string, Provenance[]>;
  entityId: string;
  value: Record<string, Json>;
  provenance: Provenance[];
}
export interface State {
  version: number;
  facts: StateFact[];
}
export interface Candidate {
  entity: Entity;
  signals: string[];
  score?: number;
  depth?: number;
  materialEffects?: string[];
  paths?: { from: string; to: string; type: string }[][];
}
export interface Decision {
  candidate: string;
  selected: boolean;
  reason: string;
  materialEffects: string[];
  confidence: number;
  evidence?: Json;
}
export interface TaskContext {
  schemaVersion: "1.0" | "2.0";
  constraintDetails?: ConstraintDetail[];
  knowledgeWarnings?: KnowledgeWarning[];
  omittedEntityIds?: string[];
  task: Task;
  entities: Entity[];
  constraints: { must: string[]; mustNot: string[]; may: string[] };
  relationships: { from: string; to: string; type?: string }[];
  continuity: StateFact[];
  outputRequirements: Record<string, Json>;
}
export interface DomainEncyclopedia {
  revision: string;
  all(): Entity[];
  get(id: string): Entity | undefined;
}
export interface CandidateRetriever {
  retrieve(task: Task, encyclopedia: DomainEncyclopedia): Promise<Candidate[]>;
}
export interface DecisionProvider {
  id: string;
  select(input: {
    task: Task;
    candidates: Candidate[];
    currentState: State;
  }): Promise<Decision[]>;
}
export interface ContextCompiler {
  compile(input: {
    task: Task;
    selected: Entity[];
    currentState: State;
    overrides: Overrides;
    decisions?: Decision[];
    maxContextBytes?: number;
  }): Promise<TaskContext>;
}
export interface GenerationProvider {
  id: string;
  generate(context: TaskContext): Promise<Json>;
}
export interface OutputAdapter {
  adapt(output: Json, context: TaskContext): Promise<Json>;
}
export interface StateStore {
  read(): Promise<State>;
  commit(expectedVersion: number, facts: StateFact[]): Promise<void>;
}
export interface ProjectAdapter {
  validateContext(context: TaskContext): void;
  validateOutput(output: Json, context: TaskContext): void;
  deriveState(output: Json, context: TaskContext): Promise<StateFact[]>;
}
