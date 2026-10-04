import type { DomainEncyclopedia, Entity } from '../core/contracts.js';
export class MemoryEncyclopedia implements DomainEncyclopedia {
 private entries: Map<string,Entity>;
 constructor(public revision: string, entities: Entity[]) {
  this.entries=new Map();
  for(const e of entities){ if(this.entries.has(e['@id'])) throw Error('Duplicate entity '+e['@id']); this.entries.set(e['@id'],structuredClone(e)); }
  for(const e of entities) for(const id of e.relationships) if(!this.entries.has(id)) throw Error('Unresolved relationship '+id);
 }
 all(){return structuredClone([...this.entries.values()]);}
 get(id:string){const e=this.entries.get(id);return e?structuredClone(e):undefined;}
}
