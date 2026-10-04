import type { OutputAdapter, GenerationProvider, ProjectAdapter } from '../core/contracts.js';
export class JsonOutputAdapter implements OutputAdapter { async adapt(output:Parameters<OutputAdapter['adapt']>[0]){return structuredClone(output);} }
/** Offline fixture only: emits context, never claims to generate real media. */
export class PreviewGenerationProvider implements GenerationProvider { id='offline-preview'; async generate(context:Parameters<GenerationProvider['generate']>[0]){return {kind:'preview',context:JSON.parse(JSON.stringify(context))};} }
export const statelessProject:ProjectAdapter={validateContext(){},validateOutput(){},async deriveState(){return [];}};
