import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const w = JSON.parse(readFileSync('work/world-direct.json', 'utf8')).response;
const cat = JSON.parse(readFileSync('work/companion-result.json', 'utf8'));
mkdirSync('public/demo', { recursive: true });
for (const [url, path] of [
  [w.assets.splats.spz_urls['500k'], 'public/demo/sanctuary.spz'],
  [cat.assets.glbUrl, 'public/demo/mochi.glb'],
]) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Asset fetch ${r.status}`);
  const b = Buffer.from(await r.arrayBuffer());
  writeFileSync(path, b);
  console.log(path, b.length);
}
writeFileSync(
  'public/demo-world.json',
  JSON.stringify(
    {
      splatUrl: '/demo/sanctuary.spz',
      modelUrl: '/demo/mochi.glb',
      worldUrl: w.world_marble_url,
      worldId: w.world_id,
      source: 'World Labs Marble 1.1',
      modelSource: 'Mint',
      semantics: w.assets.splats.semantics_metadata,
    },
    null,
    2,
  ),
);
writeFileSync(
  'docs/DEMO-ASSETS.md',
  `# Prepared demo assets\n\nSanctuary: World Labs Marble 1.1, world ID ${w.world_id}. Operation f4bd646f-8a8f-453a-a424-2daeaac739e3 completed successfully. 500k SPZ is bundled locally.\n\nCompanion: Mint model ${cat.id}, ${cat.name}. Operation s97a8p08bmkyvwb350hzexeckx8dwcde succeeded. GLB is bundled locally.\n\nThese are real generated spatial assets, prepared before the demo. Tripo generation returned insufficient credits (code 2010); no Tripo-generated asset is claimed. Convex bridge source is included but no deployment was configured.\n`,
);
