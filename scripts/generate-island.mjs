import {readFileSync,writeFileSync} from 'node:fs';
const key=readFileSync('.dev.vars','utf8').split('\n').find(l=>l.startsWith('MINT_API_KEY=')).slice(13).replace(/^['"]|['"]$/g,'');
const headers={Authorization:`Bearer ${key}`,'Content-Type':'application/json'};
const up=await fetch('https://api.mint.gg/v1/reference-images',{method:'POST',headers,body:JSON.stringify({base64Data:readFileSync('public/island.png').toString('base64'),fileName:'memorial-island.png',contentType:'image/png',name:'Rememberverse island concept'})}).then(r=>r.json());writeFileSync('work/island-reference.json',JSON.stringify(up));console.log('Reference response',JSON.stringify(up).slice(0,1200));
