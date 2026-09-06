import { env } from 'cloudflare:workers';
export const runtime = () =>
  env as unknown as {
    DB: D1Database;
    PHOTOS: R2Bucket;
    WLT_API_KEY?: string;
    TRIPO_API_KEY?: string;
    MINT_API_KEY?: string;
    CONVEX_URL?: string;
    CONVEX_BRIDGE_SECRET?: string;
  };
export const db = () => runtime().DB;
export function session(req: Request) {
  const token = req.headers
    .get('cookie')
    ?.match(/(?:^|; )mc_session=([a-f0-9-]{36})(?:;|$)/)?.[1];
  return { owner: token || crypto.randomUUID(), fresh: !token };
}
export function reply(
  req: Request,
  data: unknown,
  status = 200,
  owner?: string,
) {
  const headers = new Headers({ 'Cache-Control': 'no-store' });
  if (owner)
    headers.set(
      'Set-Cookie',
      `mc_session=${owner}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${new URL(req.url).protocol === 'https:' ? '; Secure' : ''}`,
    );
  return Response.json(data, { status, headers });
}
export function text(v: unknown, max = 1000) {
  if (typeof v !== 'string') return '';
  return v.trim().slice(0, max);
}
export async function remote(url: string, init: RequestInit = {}) {
  const r = await fetch(url, { ...init, signal: AbortSignal.timeout(45000) });
  if (!r.ok) {
    const detail = await r.text();
    throw new Error(
      /credit|balance|insufficient|billing/i.test(detail) || r.status === 402
        ? 'The provider needs more credits.'
        : r.status === 401 || r.status === 403
          ? 'The provider rejected this API key or its permissions.'
          : r.status === 429
            ? 'The provider is busy. Please try again shortly.'
            : `Generation provider returned ${r.status}.`,
    );
  }
  return r.json() as Promise<any>;
}
