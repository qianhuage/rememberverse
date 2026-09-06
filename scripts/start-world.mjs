import { readFileSync, writeFileSync } from 'node:fs';
const demo = JSON.parse(readFileSync('work/demo-session.json', 'utf8'));
const headers = { 'Content-Type': 'application/json', cookie: demo.cookie };
const island = await fetch('http://localhost:3100/api/islands', {
  method: 'POST',
  headers,
  body: JSON.stringify({
    name: 'The Sanctuary',
    kind: 'pet',
    theme: 'blossom',
    story:
      'A peaceful classical floating memorial island. A little garden for the people and pets we love.',
    dates: 'A little forever',
  }),
}).then((r) => r.json());
const id = island.island.id;
const r = await fetch(`http://localhost:3100/api/islands/${id}/generate`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ provider: 'world' }),
}).then((r) => r.json());
writeFileSync(
  'work/world-demo.json',
  JSON.stringify({ id, cookie: demo.cookie }),
);
console.log(JSON.stringify(r));
