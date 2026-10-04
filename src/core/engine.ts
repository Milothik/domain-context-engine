import type { DomainEncyclopedia,CandidateRetriever,DecisionProvider,ContextCompiler,GenerationProvider,OutputAdapter,StateStore,ProjectAdapter,Task,Overrides } from './contracts.js';
export interface EngineOptions { encyclopedia:DomainEncyclopedia; retriever:CandidateRetriever; decision:DecisionProvider; compiler:ContextCompiler; generator:GenerationProvider; output:OutputAdapter; state:StateStore; project:ProjectAdapter; maxContextBytes?:number }
export async function run(options:EngineOptions,task:Task,overrides:Overrides={},decisionProvider:DecisionProvider=options.decision){
 const {encyclopedia,retriever,compiler,generator,output,state,project}=options;
 const currentState=await state.read();
 const include=new Set(overrides.include??[]),exclude=new Set(overrides.exclude??[]);
 for(const id of [...include,...exclude,...Object.keys(overrides.locks??{})]) if(!encyclopedia.get(id)) throw Error('Unknown override entity '+id);
 for(const id of include) if(exclude.has(id)) throw Error('Conflicting human overrides '+id);
 for(const id of Object.keys(overrides.locks??{})) if(exclude.has(id)) throw Error('Cannot lock excluded entity '+id);else include.add(id);
 const candidates=await retriever.retrieve(structuredClone(task),encyclopedia);
 for(const id of include) if(!candidates.some(c=>c.entity['@id']===id)) candidates.push({entity:encyclopedia.get(id)!,signals:['human-include']});
 const candidateIds=new Set(candidates.map(c=>c.entity['@id']));
 if(candidateIds.size!==candidates.length) throw Error('Duplicate candidates');
 const raw=await decisionProvider.select({task:structuredClone(task),candidates:structuredClone(candidates),currentState:structuredClone(currentState)});
 const seen=new Set<string>();
 for(const d of raw){if(!candidateIds.has(d.candidate)||seen.has(d.candidate)||typeof d.selected!=='boolean'||!d.reason||!Array.isArray(d.materialEffects)||!Number.isFinite(d.confidence)||d.confidence<0||d.confidence>1) throw Error('Invalid decision result');seen.add(d.candidate);}
 if(seen.size!==candidateIds.size) throw Error('Provider must explain every candidate');
 const decisions=raw.map(d=>include.has(d.candidate)||exclude.has(d.candidate)?{...d,selected:include.has(d.candidate),reason:'Human override',evidence:{providerDecision:JSON.parse(JSON.stringify(d))}}:d);
 const selected=candidates.filter(c=>decisions.some(d=>d.candidate===c.entity['@id']&&d.selected)).map(c=>c.entity);
 const context=await compiler.compile({task:structuredClone(task),selected,currentState:structuredClone(currentState),overrides:structuredClone(overrides)});
 project.validateContext(context);
 const contextBytes=new TextEncoder().encode(JSON.stringify(context)).length;
 if(contextBytes>(options.maxContextBytes??65536)) throw Error('Context budget exceeded; refine domain projection instead of dropping hard constraints');
 const generated=await generator.generate(structuredClone(context));
 const result=await output.adapt(generated,structuredClone(context));
 project.validateOutput(result,context);
 const updates=await project.deriveState(result,context);
 if(updates.length) await state.commit(currentState.version,updates);
 return {output:result,context,trace:{encyclopediaRevision:encyclopedia.revision,taskId:task.id,decisionProvider:decisionProvider.id,generationProvider:generator.id,stateVersion:currentState.version,overrides:structuredClone(overrides),decisions,contextBytes}};
}
