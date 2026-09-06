import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const base = 'http://localhost:3100/api';
let cookie = '';
async function request(path, body, session = cookie) {
  const r = await fetch(base + path, {
    method: body ? 'POST' : 'GET',
    headers: {
      ...(session ? { cookie: session } : {}),
      ...(body && !(body instanceof FormData)
        ? { 'Content-Type': 'application/json' }
        : {}),
    },
    body: body
      ? body instanceof FormData
        ? body
        : JSON.stringify(body)
      : undefined,
  });
  if (!cookie && r.headers.get('set-cookie'))
    cookie = r.headers.get('set-cookie').split(';')[0];
  return { status: r.status, data: await r.json() };
}
assert.equal((await request('/islands')).status, 200);
assert.equal(
  (await request('/islands', { name: '', kind: 'pet', theme: 'blossom' }))
    .status,
  400,
);
const form = new FormData();
form.append(
  'file',
  new Blob([readFileSync('public/island.png')], { type: 'image/png' }),
  'garden.png',
);
const photo = await request('/photos', form);
assert.equal(photo.status, 201);
const saved = await request('/islands', {
  name: 'Garden of Always',
  kind: 'pet',
  theme: 'blossom',
  story:
    'A sunny garden for a beloved cat. Quiet afternoons, soft paws, a lifetime of love.',
  dates: 'Always remembered',
  photo: photo.data.id,
});
assert.equal(saved.status, 201);
const id = saved.data.island.id;
assert.equal(
  (
    await request(
      '/islands/' + id,
      undefined,
      'mc_session=00000000-0000-4000-8000-000000000001',
    )
  ).status,
  404,
);
assert.equal(
  (
    await request(
      '/photos/' + photo.data.id,
      undefined,
      'mc_session=00000000-0000-4000-8000-000000000001',
    )
  ).status,
  404,
);
assert.equal(
  (
    await request(`/islands/${id}/generate`, {
      provider: 'character',
      photo: 'missing-reference',
    })
  ).status,
  400,
);
assert.equal(
  (
    await request(
      `/islands/${id}/generate`,
      { provider: 'character', photo: photo.data.id },
      'mc_session=00000000-0000-4000-8000-000000000001',
    )
  ).status,
  404,
);
for (const kind of ['candle', 'flower', 'note'])
  assert.equal(
    (
      await request(`/islands/${id}/memories`, {
        kind,
        text: kind === 'note' ? 'Every sunbeam reminds me of you.' : '',
      })
    ).status,
    201,
  );
const loaded = await request('/islands/' + id);
assert.equal(loaded.data.memories.length, 3);
assert.equal(loaded.data.island.photo, photo.data.id);
const wrong = new FormData();
wrong.append(
  'file',
  new Blob(['not an image'], { type: 'image/png' }),
  'fake.png',
);
assert.equal((await request('/photos', wrong)).status, 400);
mkdirSync('work', { recursive: true });
writeFileSync('work/demo-session.json', JSON.stringify({ id, cookie }));
console.log(
  'PASS: upload, image validation, island creation, durable memory readback, cross-session island/photo isolation.',
);
if (process.argv.includes('--generate'))
  for (const provider of ['world', 'tripo', 'mint']) {
    const r = await request(`/islands/${id}/generate`, { provider });
    console.log(provider, JSON.stringify(r));
  }
