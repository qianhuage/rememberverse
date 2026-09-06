import { readFileSync, writeFileSync } from 'node:fs';
const key = readFileSync('.dev.vars', 'utf8')
  .split('\n')
  .find((l) => l.startsWith('MINT_API_KEY='))
  .slice(13)
  .replace(/^['"]|['"]$/g, '');
const op = JSON.parse(readFileSync('work/companion-operation.json', 'utf8'));
const r = await fetch(`https://api.mint.gg/v1/operations/${op.id}`, {
  headers: { Authorization: `Bearer ${key}` },
});
const data = await r.json();
writeFileSync('work/companion-status.json', JSON.stringify(data));
console.log(JSON.stringify(data).slice(0, 2000));
if (data.status === 'succeeded') {
  const model = await fetch(
    `https://api.mint.gg/v1/models/${data.resource.id}`,
    { headers: { Authorization: `Bearer ${key}` } },
  ).then((r) => r.json());
  writeFileSync('work/companion-result.json', JSON.stringify(model));
  console.log('model', JSON.stringify(model).slice(0, 4000));
}
