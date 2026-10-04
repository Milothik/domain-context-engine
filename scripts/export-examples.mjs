import fs from 'node:fs';
const root=new URL('../',import.meta.url);
const read=p=>JSON.parse(fs.readFileSync(new URL(p,root),'utf8'));
const context=read('examples/jsonld-context.json')['@context'];
for(const domain of ['weirdway','product-brand']){
  const entities=read('examples/'+domain+'/entities.json');
  const graph=entities.map(e=>({...e,relationships:e.relationships.map(r=>typeof r==='string'?{to:r,type:'related'}:r)}));
  fs.writeFileSync(new URL('examples/'+domain+'/encyclopedia.jsonld',root),JSON.stringify({'@context':context,'@graph':graph},null,2)+'\n');
}
