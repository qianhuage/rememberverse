import { readFileSync, writeFileSync } from 'node:fs';
const key = readFileSync('.dev.vars', 'utf8')
  .split('\n')
  .find((l) => l.startsWith('MINT_API_KEY='))
  .slice(13)
  .replace(/^['"]|['"]$/g, '');
const r = await fetch('https://api.mint.gg/v1/models:generate', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    'Idempotency-Key': 'metacemetery-mochi-companion-01',
  },
  body: JSON.stringify({
    prompt:
      'A beautiful stylized small white and cream fluffy cat with round expressive kind dark eyes, sitting with a gently curling tail and looking up. Elegant premium collectible character, soft sculpted fur details, warm ivory fur with pale apricot ears, little gold collar with round pendant, peaceful friendly face. Pixar quality but subtle and tasteful, physically based detailed materials, single isolated character full body, no ground, no background, no text. Ready for a peaceful memorial garden interactive game.',
    name: 'Mochi — Meta Cemetery companion',
    generationMode: 'auto',
    generationPreset: 'standard',
  }),
});
const d = await r.json();
writeFileSync('work/companion-operation.json', JSON.stringify(d));
console.log(r.status, d.id, d.status, d.error || '');
