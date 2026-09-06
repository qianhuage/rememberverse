import { db, runtime, session, reply, text, remote } from '@/lib/server';
import { islandPrompt, type Island } from '@/lib/types';
const W = 'https://api.worldlabs.ai/marble/v1',
  T = 'https://openapi.tripo3d.ai/v3',
  M = 'https://api.mint.gg/v1';
async function handle(req: Request) {
  const { owner, fresh } = session(req),
    path = new URL(req.url).pathname.split('/').filter(Boolean).slice(1),
    method = req.method;
  const out = (data: unknown, status = 200) =>
    reply(req, data, status, fresh ? owner : undefined);
  try {
    if (
      method !== 'GET' &&
      req.headers.get('origin') &&
      new URL(req.headers.get('origin')!).origin !== new URL(req.url).origin
    )
      return out({ error: 'Invalid request origin' }, 403);
    if (path[0] === 'status')
      return out({
        world: !!runtime().WLT_API_KEY,
        tripo: !!runtime().TRIPO_API_KEY,
        mint: !!runtime().MINT_API_KEY,
        convex: !!(runtime().CONVEX_URL && runtime().CONVEX_BRIDGE_SECRET),
      });
    if (path[0] === 'photos') {
      if (method === 'POST') {
        if (Number(req.headers.get('content-length')) > 9 * 1024 * 1024)
          return out({ error: 'Choose a photo under 8 MB.' }, 413);
        const form = await req.formData(),
          f = form.get('file');
        if (
          !(f instanceof File) ||
          !['image/jpeg', 'image/png', 'image/webp'].includes(f.type) ||
          f.size > 8 * 1024 * 1024 ||
          f.size === 0
        )
          return out(
            { error: 'Use a JPG, PNG or WebP photo under 8 MB.' },
            400,
          );
        const bytes = await f.arrayBuffer(),
          b = new Uint8Array(bytes);
        const valid =
          f.type === 'image/jpeg'
            ? b[0] === 255 && b[1] === 216
            : f.type === 'image/png'
              ? b[0] === 137 && b[1] === 80 && b[2] === 78 && b[3] === 71
              : b[0] === 82 && b[1] === 73 && b[8] === 87 && b[9] === 69;
        if (!valid)
          return out(
            { error: 'This file does not appear to be a supported photo.' },
            400,
          );
        const id = crypto.randomUUID();
        await runtime().PHOTOS.put(id, bytes, {
          httpMetadata: { contentType: f.type },
        });
        await db()
          .prepare('INSERT INTO photos(id,owner,mime) VALUES(?,?,?)')
          .bind(id, owner, f.type)
          .run();
        return out({ id, url: `/api/photos/${id}` }, 201);
      }
      const photo = await db()
        .prepare('SELECT * FROM photos WHERE id=? AND owner=?')
        .bind(path[1] || '', owner)
        .first();
      if (!photo) return out({ error: 'Photo not found' }, 404);
      const file = await runtime().PHOTOS.get(path[1]);
      if (!file) return out({ error: 'Photo not found' }, 404);
      return new Response(file.body, {
        headers: {
          'Content-Type': String(photo.mime),
          'Cache-Control': 'private, max-age=3600',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }
    if (path[0] !== 'islands') return out({ error: 'Not found' }, 404);
    if (path.length === 1) {
      if (method === 'GET')
        return out({
          islands: (
            await db()
              .prepare(
                'SELECT * FROM islands WHERE owner=? ORDER BY created DESC',
              )
              .bind(owner)
              .all()
          ).results,
        });
      const b = (await req.json()) as Record<string, unknown>,
        name = text(b.name, 80),
        story = text(b.story, 2000),
        theme = text(b.theme, 20),
        kind = text(b.kind, 10),
        photo = text(b.photo, 40);
      if (
        !name ||
        !['person', 'pet'].includes(kind) ||
        !['blossom', 'coast', 'starlight'].includes(theme)
      )
        return out({ error: 'Add a name and choose an island.' }, 400);
      if (
        photo &&
        !(await db()
          .prepare('SELECT id FROM photos WHERE id=? AND owner=?')
          .bind(photo, owner)
          .first())
      )
        return out({ error: 'Photo not found' }, 400);
      const island = {
        id: crypto.randomUUID(),
        name,
        story,
        theme,
        kind,
        photo: photo || null,
        dates: text(b.dates, 80),
        created: Date.now(),
      };
      await db()
        .prepare(
          'INSERT INTO islands(id,owner,name,kind,theme,story,dates,photo,created) VALUES(?,?,?,?,?,?,?,?,?)',
        )
        .bind(
          island.id,
          owner,
          name,
          kind,
          theme,
          story,
          island.dates,
          island.photo,
          island.created,
        )
        .run();
      return out({ island }, 201);
    }
    const island = await db()
      .prepare('SELECT * FROM islands WHERE id=? AND owner=?')
      .bind(path[1], owner)
      .first<Island>();
    if (!island) return out({ error: 'Island not found' }, 404);
    if (path.length === 2)
      return out({
        island,
        memories: (
          await db()
            .prepare(
              'SELECT * FROM memories WHERE island=? ORDER BY created DESC',
            )
            .bind(island.id)
            .all()
        ).results,
        jobs: (
          await db()
            .prepare('SELECT * FROM jobs WHERE island=?')
            .bind(island.id)
            .all()
        ).results,
      });
    if (path[2] === 'memories' && method === 'POST') {
      const b = (await req.json()) as Record<string, unknown>,
        kind = text(b.kind, 20),
        message = text(b.text, 2000);
      if (
        !['candle', 'flower', 'note'].includes(kind) ||
        (kind === 'note' && !message)
      )
        return out({ error: 'Write a memory first.' }, 400);
      const memory = {
        id: crypto.randomUUID(),
        kind,
        text: message,
        created: Date.now(),
      };
      await db()
        .prepare(
          'INSERT INTO memories(id,island,kind,text,created) VALUES(?,?,?,?,?)',
        )
        .bind(memory.id, island.id, kind, message, memory.created)
        .run();
      // Optional authenticated Convex bridge replicates events for realtime subscribers.
      if (runtime().CONVEX_URL && runtime().CONVEX_BRIDGE_SECRET) {
        try {
          await remote(`${runtime().CONVEX_URL}/api/mutation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              path: 'memories:record',
              args: {
                secret: runtime().CONVEX_BRIDGE_SECRET,
                islandId: island.id,
                event: JSON.stringify(memory),
              },
              format: 'json',
            }),
          });
        } catch {
          /* D1 remains authoritative if optional realtime sync is unavailable. */
        }
      }
      return out({ memory }, 201);
    }
    if (path[2] === 'generate' && method === 'POST') {
      const b = (await req.json()) as Record<string, unknown>,
        provider = text(b.provider, 20);
      if (!['world', 'tripo', 'mint'].includes(provider))
        return out({ error: 'Unknown provider' }, 400);
      const key =
        provider === 'world'
          ? runtime().WLT_API_KEY
          : provider === 'tripo'
            ? runtime().TRIPO_API_KEY
            : runtime().MINT_API_KEY;
      if (!key)
        return out(
          { error: 'This generation provider is not configured yet.' },
          503,
        );
      const existing = await db()
        .prepare('SELECT * FROM jobs WHERE island=? AND provider=?')
        .bind(island.id, provider)
        .first();
      if (existing) return out({ job: existing });
      const id = crypto.randomUUID(),
        created = Date.now();
      try {
        await db()
          .prepare(
            'INSERT INTO jobs(id,island,provider,status,created) VALUES(?,?,?,?,?)',
          )
          .bind(id, island.id, provider, 'starting', created)
          .run();
      } catch {
        return out(
          { error: 'Generation is already starting. Refresh in a moment.' },
          409,
        );
      }
      try {
        let operation = '';
        const prompt = islandPrompt(island);
        if (provider === 'world') {
          const headers = {
            'WLT-Api-Key': key,
            'Content-Type': 'application/json',
          };
          let world_prompt: any = { type: 'text', text_prompt: prompt };
          if (island.photo) {
            const file = await runtime().PHOTOS.get(island.photo);
            if (file) {
              const extension =
                file.httpMetadata?.contentType === 'image/png'
                  ? 'png'
                  : file.httpMetadata?.contentType === 'image/webp'
                    ? 'webp'
                    : 'jpg';
              const up = await remote(`${W}/media-assets:prepare_upload`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                  file_name: `memory.${extension}`,
                  kind: 'image',
                  extension,
                }),
              });
              const signed = new URL(up.upload_info.upload_url);
              if (signed.protocol !== 'https:')
                throw new Error('Invalid upload destination');
              const uploaded = await fetch(signed, {
                method: up.upload_info.upload_method,
                headers: up.upload_info.required_headers,
                body: await file.arrayBuffer(),
                signal: AbortSignal.timeout(45000),
              });
              if (!uploaded.ok)
                throw new Error('The reference photo could not be uploaded.');
              world_prompt = {
                type: 'image',
                image_prompt: {
                  source: 'media_asset',
                  media_asset_id:
                    up.media_asset.media_asset_id || up.media_asset.id,
                },
                text_prompt: prompt,
              };
            }
          }
          const r = await remote(`${W}/worlds:generate`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              display_name: `Rememberverse — ${island.name}`,
              model: 'marble-1.1',
              world_prompt,
            }),
          });
          operation = r.operation_id;
        } else if (provider === 'tripo') {
          const headers = { Authorization: `Bearer ${key}` };
          let input = '';
          if (island.photo) {
            const file = await runtime().PHOTOS.get(island.photo);
            if (file) {
              const form = new FormData();
              form.append(
                'file',
                new Blob([await file.arrayBuffer()], {
                  type: file.httpMetadata?.contentType || 'image/jpeg',
                }),
                'memory.jpg',
              );
              const up = await remote(`${T}/files`, {
                method: 'POST',
                headers,
                body: form,
              });
              input = up.data?.file_token;
            }
          }
          const r = await remote(
            `${T}/generation/${input ? 'image-to-model' : 'text-to-model'}`,
            {
              method: 'POST',
              headers: { ...headers, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...(input
                  ? { input }
                  : {
                      prompt: `A beautiful small memorial keepsake sculpture for ${island.name}. ${island.kind === 'pet' ? 'A peaceful sleeping pet on a round stone base' : 'A flowering tree with a tiny garden bench'}. Ivory ceramic and delicate gold accents. Single object, no text.`,
                    }),
                model: 'v3.1-20260211',
                texture: true,
                pbr: true,
                texture_quality: 'detailed',
              }),
            },
          );
          operation = r.data?.task_id;
        } else {
          const r = await remote(`${M}/worlds:generate`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${key}`,
              'Content-Type': 'application/json',
              'Idempotency-Key': id,
            },
            body: JSON.stringify({
              prompt,
              generationMode: 'auto',
              generationPreset: 'standard',
            }),
          });
          operation = r.id || r.operation?.id;
        }
        if (!operation)
          throw new Error(
            'The provider did not return a generation identifier.',
          );
        await db()
          .prepare('UPDATE jobs SET status=?,operation=? WHERE id=?')
          .bind('running', operation, id)
          .run();
      } catch (e) {
        await db()
          .prepare('UPDATE jobs SET status=?,error=? WHERE id=?')
          .bind(
            'failed',
            e instanceof Error ? e.message : 'Generation failed',
            id,
          )
          .run();
      }
      return out({
        job: await db()
          .prepare('SELECT * FROM jobs WHERE id=?')
          .bind(id)
          .first(),
      });
    }
    if (path[2] === 'jobs' && method === 'GET') {
      const jobs = (
        await db()
          .prepare('SELECT * FROM jobs WHERE island=?')
          .bind(island.id)
          .all()
      ).results;
      for (const j of jobs) {
        if (j.status !== 'running' || !j.operation) continue;
        try {
          let state = 'running',
            result: any = null,
            error = '';
          if (j.provider === 'world') {
            const r = await remote(
              `${W}/operations/${encodeURIComponent(String(j.operation))}`,
              { headers: { 'WLT-Api-Key': runtime().WLT_API_KEY! } },
            );
            if (r.done) {
              state = r.error ? 'failed' : 'complete';
              error = r.error ? 'World generation could not finish.' : '';
              result = r.response;
            }
          } else if (j.provider === 'tripo') {
            const r = await remote(
              `${T}/tasks/${encodeURIComponent(String(j.operation))}`,
              {
                headers: { Authorization: `Bearer ${runtime().TRIPO_API_KEY}` },
              },
            );
            if (r.data?.status === 'success') {
              state = 'complete';
              result = r.data.output;
            } else if (['failed', 'cancelled'].includes(r.data?.status)) {
              state = 'failed';
              error = 'Keepsake generation could not finish.';
            }
          } else {
            const r = await remote(
              `${M}/operations/${encodeURIComponent(String(j.operation))}`,
              {
                headers: { Authorization: `Bearer ${runtime().MINT_API_KEY}` },
              },
            );
            if (['succeeded', 'partially_succeeded'].includes(r.status)) {
              state = 'complete';
              result = r.resource?.id
                ? await remote(
                    `${M}/worlds/${encodeURIComponent(r.resource.id)}`,
                    {
                      headers: {
                        Authorization: `Bearer ${runtime().MINT_API_KEY}`,
                      },
                    },
                  )
                : r;
            } else if (
              ['failed', 'canceled', 'billing_required'].includes(r.status)
            ) {
              state = 'failed';
              error =
                r.status === 'billing_required'
                  ? 'Mint needs additional credits.'
                  : 'Mint generation could not finish.';
            }
          }
          if (state !== 'running')
            await db()
              .prepare('UPDATE jobs SET status=?,result=?,error=? WHERE id=?')
              .bind(state, JSON.stringify(result), error, String(j.id))
              .run();
        } catch {
          /* transient polling errors keep the durable running job available */
        }
      }
      return out({
        jobs: (
          await db()
            .prepare('SELECT * FROM jobs WHERE island=?')
            .bind(island.id)
            .all()
        ).results,
      });
    }
    return out({ error: 'Not found' }, 404);
  } catch (e) {
    console.error(
      'Memorial request failed',
      e instanceof Error ? e.message : 'Unknown error',
    );
    return out(
      { error: 'Your request could not be saved. Please try again.' },
      500,
    );
  }
}
export const GET = handle;
export const POST = handle;
