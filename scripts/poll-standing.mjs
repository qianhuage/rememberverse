import {readFileSync,writeFileSync} from 'node:fs';
const key=readFileSync('.dev.vars','utf8').split('\n').find(l=>l.startsWith('MINT_API_KEY=')).slice(13).replace(/^['"]|['"]$/g,'');
const headers={Authorization:`Bearer ${key}`};
for(const name of ['dog-standing']){
 const op=JSON.parse(readFileSync(`work/${name}-operation.json`));
 const status=await fetch(`https://api.mint.gg/v1/operations/${op.id}`,{headers}).then(r=>r.json());
 console.log(name,status.status);
 if(status.status==='succeeded'){
 const model=await fetch(`https://api.mint.gg/v1/models/${status.resource.id}`,{headers}).then(r=>r.json());writeFileSync(`work/${name}-result.json`,JSON.stringify(model));console.log(JSON.stringify(model).slice(0,2000));
 }
}
