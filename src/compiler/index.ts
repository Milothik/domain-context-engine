import type { ContextCompiler } from '../core/contracts.js';
export class CompactContextCompiler implements ContextCompiler {
 async compile({task,selected,currentState,overrides}:Parameters<ContextCompiler['compile']>[0]){
 const entities=structuredClone(selected).map(e=>({...e,attributes:{...e.attributes,...overrides.locks?.[e['@id']]}}));
 const ids=new Set(entities.map(e=>e['@id']));
 const unique=(v:string[])=>[...new Set(v)].sort();
 return {schemaVersion:'1.0' as const,task:structuredClone(task),entities,
 constraints:{must:unique([...task.must,...entities.flatMap(e=>e.rules.mustPreserve),...overrides.rules?.must??[]]),mustNot:unique([...task.mustNot,...entities.flatMap(e=>e.rules.avoid),...overrides.rules?.mustNot??[]]),may:unique(entities.flatMap(e=>e.rules.mayVary))},
 relationships:entities.flatMap(e=>e.relationships.filter(to=>ids.has(to)).map(to=>({from:e['@id'],to}))),
 continuity:structuredClone(currentState.facts.filter(f=>ids.has(f.entityId))),
 outputRequirements:{...task.outputRequirements,...overrides.outputRequirements}};
 }
}
