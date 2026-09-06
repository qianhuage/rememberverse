'use client';
import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import {
  ArrowUpRight,
  Plus,
  Sparkles,
  Heart,
  Flower2,
  Wind,
  ArrowRight,
  ArrowLeft,
  Camera,
  PawPrint,
  UserRound,
  Flame,
  BookOpen,
  Orbit,
  Eye,
  Box,
  LoaderCircle,
  Check,
  Cloud,
  Download,
  LockKeyhole,
} from 'lucide-react';
import LivingHero from '@/components/living-hero';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  sample,
  themes,
  islandPrompt,
  type Island,
  type Memory,
  type Job,
} from '@/lib/types';
const ImmersiveScene = lazy(() => import('@/components/immersive-scene'));
const IslandScene = lazy(() => import('@/components/island-scene'));
async function api(path: string, body?: unknown) {
  const r = await fetch(
    `/api/${path}`,
    body
      ? {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      : undefined,
  );
  const data = (await r.json()) as any;
  if (!r.ok)
    throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
}
export default function Home() {
  const [screen, setScreen] = useState<'home' | 'library' | 'visit'>('home'),
    [creating, setCreating] = useState(false),
    [step, setStep] = useState(0),
    [islands, setIslands] = useState<Island[]>([]),
    [island, setIsland] = useState<Island>(sample),
    [memories, setMemories] = useState<Memory[]>([]),
    [jobs, setJobs] = useState<Job[]>([]),
    [busy, setBusy] = useState(''),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [noteOpen, setNoteOpen] = useState(false),
    [note, setNote] = useState(''),
    [view, setView] = useState('orbit'),
    [cap, setCap] = useState({
      world: false,
      tripo: false,
      mint: false,
      convex: false,
    });
  const [demo, setDemo] = useState<any>(null);
  const fallback = useCallback(() => {
    setView('orbit');
    setNotice(
      'The immersive world could not load. Your interactive island is still here.',
    );
  }, []);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('demo') === 'dog')
      setScreen('visit');
    fetch('/demo-world.json')
      .then((r) => (r.ok ? r.json() : null))
      .then(setDemo)
      .catch(() => {});
  }, []);
  const [draft, setDraft] = useState({
      name: '',
      kind: 'pet',
      dates: '',
      story: '',
      theme: 'blossom',
      photo: '',
    }),
    [photoUrl, setPhotoUrl] = useState('');
  const refresh = useCallback(async () => {
    try {
      const d = await api('islands');
      setIslands(d.islands);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useEffect(() => {
    api('status')
      .then(setCap)
      .catch(() => {});
    void refresh();
  }, [refresh]);
  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => setNotice(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [notice]);
  const start = useCallback(() => {
    setCreating(true);
    setStep(0);
    setError('');
  }, []);
  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (tool: unknown, options: unknown) => void;
        };
      }
    ).modelContext;
    if (!context) return;
    const life = new AbortController();
    try {
      context.registerTool(
        {
          name: 'start_memorial_island',
          description:
            'Open the memorial island creator. Does not upload photos or save an island.',
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false },
          execute: async (input: unknown) => {
            if (
              !input ||
              typeof input !== 'object' ||
              Object.keys(input).length
            )
              throw new Error('Expected an empty object');
            start();
            return { status: 'creator_open' };
          },
        },
        { signal: life.signal },
      );
    } catch {}
    return () => life.abort();
  }, [start]);
  async function visit(i: Island) {
    setError('');
    setIsland(i);
    setMemories([]);
    setJobs([]);
    setScreen('visit');
    setView('orbit');
    if (i.id !== 'sample') {
      try {
        const d = await api(`islands/${i.id}`);
        setMemories(d.memories);
        setJobs(d.jobs);
      } catch (e) {
        setError((e as Error).message);
      }
    }
  }
  useEffect(() => {
    if (screen !== 'visit' || island.id === 'sample') return;
    let canceled = false;
    let count = 0;
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      try {
        const d = await api(`islands/${island.id}/jobs`);
        if (!canceled) setJobs(d.jobs);
      } catch {}
      if (!canceled && count++ < 120) timer = setTimeout(poll, 10000);
    }
    timer = setTimeout(poll, 3000);
    return () => {
      canceled = true;
      clearTimeout(timer);
    };
  }, [screen, island.id, busy]);
  async function upload(file?: File) {
    if (!file) return;
    if (
      !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
      file.size > 8 * 1024 * 1024
    ) {
      setError('Choose a JPG, PNG or WebP photo under 8 MB.');
      return;
    }
    setBusy('photo');
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const r = await fetch('/api/photos', { method: 'POST', body: form });
      const d = (await r.json()) as any;
      if (!r.ok) throw new Error(d.error);
      setDraft((v) => ({ ...v, photo: d.id }));
      setPhotoUrl(d.url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy('');
    }
  }
  async function save() {
    setBusy('save');
    setError('');
    try {
      const d = await api('islands', draft);
      setCreating(false);
      setDraft({
        name: '',
        kind: 'pet',
        dates: '',
        story: '',
        theme: 'blossom',
        photo: '',
      });
      setPhotoUrl('');
      await refresh();
      await visit(d.island);
      setNotice('Their island is ready. Take your time here.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy('');
    }
  }
  async function remember(kind: string, message = '') {
    setError('');
    if (island.id === 'sample') {
      setMemories((v) => [
        { id: crypto.randomUUID(), kind, text: message, created: Date.now() },
        ...v,
      ]);
      setNoteOpen(false);
      setNote('');
      setNotice(
        'Added to this sample visit. Create an island to keep your memories.',
      );
      return;
    }
    setBusy(kind);
    try {
      const d = await api(`islands/${island.id}/memories`, {
        kind,
        text: message,
      });
      setMemories((v) => [d.memory, ...v]);
      setNoteOpen(false);
      setNote('');
      setNotice(
        kind === 'candle'
          ? 'A light for them, always.'
          : kind === 'flower'
            ? 'A little love, left in bloom.'
            : 'Your memory has a home here.',
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy('');
    }
  }
  async function generate(provider: string) {
    if (island.id === 'sample') {
      start();
      return;
    }
    setBusy(provider);
    setError('');
    try {
      const d = await api(`islands/${island.id}/generate`, { provider });
      setJobs((v) => [...v.filter((j) => j.provider !== provider), d.job]);
      if (d.job.status === 'failed') setError(d.job.error);
      else
        setNotice(
          'Creation has begun. You can leave and return while it takes shape.',
        );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy('');
    }
  }
  const modelJob = jobs.find(
      (j) => j.provider === 'tripo' && j.status === 'complete',
    ),
    worldJob = jobs.find(
      (j) => j.provider === 'world' && j.status === 'complete',
    );
  const mintJob = jobs.find(
    (j) => j.provider === 'mint' && j.status === 'complete',
  );
  const mintWorld = mintJob?.result ? JSON.parse(mintJob.result) : null;
  const model = modelJob?.result ? JSON.parse(modelJob.result) : null,
    world = worldJob?.result ? JSON.parse(worldJob.result) : null;
  const splatUrl =
    world?.assets?.splats?.spz_urls?.['500k'] ||
    mintWorld?.assets?.spzUrls?.['500k'] ||
    mintWorld?.assets?.radUrl ||
    (island.id === 'sample' ? demo?.splatUrl : null);
  const companionUrl = model?.model_url || demo?.modelUrl;
  const candles = memories.filter((m) => m.kind === 'candle').length,
    flowers = memories.filter((m) => m.kind === 'flower').length;
  return (
    <main className={`world ${screen === 'visit' ? 'visiting' : ''}`}>
      <header>
        <a
          className="brand"
          href="/"
          onClick={(e) => {
            e.preventDefault();
            setScreen('home');
          }}
        >
          <Flower2 size={28} />
          <span>
            meta cemetery<span className="brand-sub">A PLACE TO REMEMBER</span>
          </span>
        </a>
        <nav>
          <button
            className={screen === 'home' ? 'active' : ''}
            onClick={() => setScreen('home')}
          >
            The sanctuary
          </button>
          <button
            className={screen === 'library' ? 'active' : ''}
            onClick={() => {
              setScreen('library');
              void refresh();
            }}
          >
            My islands{' '}
            {islands.length > 0 && (
              <span className="count">{islands.length}</span>
            )}
          </button>
        </nav>
        <Button className="pill dark" onClick={start}>
          <Plus size={16} />
          Create an island
        </Button>
      </header>
      {screen === 'home' && (
        <>
          <LivingHero />
          <section className="intro">
            <h1>
              Some bonds
              <br />
              are <em>timeless.</em>
            </h1>
            <p>
              A world for the people and paws you love.
              <br />
              An island for every story. A place to return.
            </p>
            <Button className="pill dark main-cta" onClick={start}>
              Create their island <ArrowUpRight size={18} />
            </Button>
          </section>
          <button className="world-caption" onClick={() => visit(sample)}>
            <span className="status-dot" />
            <div>
              The Garden of Always<small>Meet the dog · Explore in 3D</small>
            </div>
            <ArrowUpRight size={18} />
          </button>
          <footer>
            <span>
              <Wind size={15} /> A quieter corner of the universe.
            </span>
            <span>EVERY LOVE. EVERY LITTLE LIFE.</span>
            <span>
              <Sparkles size={15} /> Made of memories
            </span>
          </footer>
        </>
      )}
      {screen === 'library' && (
        <section className="library">
          <div className="eyebrow">YOUR LITTLE CORNER OF FOREVER</div>
          <h1>
            The ones we
            <br />
            <em>carry with us.</em>
          </h1>
          <p>Your saved islands live here. Return whenever you need to.</p>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <div className="island-grid">
            {islands.map((i) => (
              <button
                key={i.id}
                className={`island-card theme-${i.theme}`}
                onClick={() => visit(i)}
              >
                <img src="/island.png" alt={`${i.name}'s memorial garden`} />
                <div className="card-copy">
                  {i.photo && (
                    <img
                      className="avatar"
                      src={`/api/photos/${i.photo}`}
                      alt={i.name}
                    />
                  )}
                  <div>
                    <h2>{i.name}</h2>
                    <span>{i.dates || 'Always remembered'}</span>
                  </div>
                  <ArrowUpRight />
                </div>
              </button>
            ))}
            <button className="new-island" onClick={start}>
              <Plus size={30} />
              <h2>
                {islands.length
                  ? 'Make room for another love'
                  : 'Your first island starts with love'}
              </h2>
              <span>Add a photo. Tell their story.</span>
            </button>
          </div>
          <p className="privacy-note">
            <LockKeyhole size={14} /> Islands are private to this browser’s
            secure session. Keep this browser’s cookies to return.
          </p>
          <button
            className="text-link mobile-nav"
            onClick={() => setScreen('home')}
          >
            Back to the sanctuary
          </button>
        </section>
      )}
      {screen === 'visit' && (
        <section className="visit">
          <Suspense
            fallback={
              <div className="scene-loading">
                <LoaderCircle className="spin" />
                Opening their garden…
              </div>
            }
          >
            {view === 'immersive' && splatUrl ? (
              <ImmersiveScene
                url={splatUrl}
                modelUrl={companionUrl}
                onFailure={fallback}
                candles={candles}
                flowers={flowers}
                scale={
                  world?.assets?.splats?.semantics_metadata
                    ?.metric_scale_factor ||
                  (island.id === 'sample'
                    ? demo?.semantics?.metric_scale_factor
                    : 1)
                }
                ground={
                  world?.assets?.splats?.semantics_metadata
                    ?.ground_plane_offset ||
                  (island.id === 'sample'
                    ? demo?.semantics?.ground_plane_offset
                    : 0)
                }
              />
            ) : (
              <IslandScene
                island={island}
                candles={candles}
                flowers={flowers}
                modelUrl={companionUrl}
                view={view}
              />
            )}
          </Suspense>
          <div className="visit-top">
            <button
              className="glass icon-text"
              onClick={() => setScreen('library')}
            >
              <ArrowLeft size={16} />
              My islands
            </button>
            <span className="glass scene-hint">
              {view === 'immersive'
                ? 'W A S D to move · Drag to look'
                : 'Click a path to walk · W A S D to guide · Drag to orbit'}
            </span>
          </div>
          <div className="memorial-card glass">
            {island.photo || island.id === 'sample' ? (
              <img
                className="portrait"
                src={
                  island.id === 'sample'
                    ? '/demo/dog-reference.jpg'
                    : `/api/photos/${island.photo}`
                }
                alt={island.name}
              />
            ) : (
              <div className="portrait placeholder">
                <PawPrint size={30} />
              </div>
            )}
            <div className="eyebrow">
              {island.id === 'sample'
                ? 'SAMPLE MEMORIAL'
                : 'FOREVER IN OUR WORLD'}
            </div>
            <h2>{island.name}</h2>
            <span className="dates">
              {island.dates || 'Always, and a little longer.'}
            </span>
            <p>
              {island.story || 'A place for the memories that make them yours.'}
            </p>
            <div className="offering-count">
              <span>
                <Flame size={15} />
                {candles} lights
              </span>
              <span>
                <Flower2 size={15} />
                {flowers} flowers
              </span>
            </div>
          </div>
          <div className="camera-controls glass">
            {splatUrl && (
              <button
                className={view === 'immersive' ? 'selected' : ''}
                onClick={() => setView('immersive')}
              >
                <Cloud size={17} />
                <span>Dream world</span>
              </button>
            )}
            <button
              className={view === 'orbit' ? 'selected' : ''}
              onClick={() => setView('orbit')}
              title="Orbit island"
            >
              <Orbit size={17} />
              <span>Living island</span>
            </button>
            <button
              className={view === 'follow' ? 'selected' : ''}
              onClick={() => setView('follow')}
              title="Follow your dog"
            >
              <PawPrint size={17} />
              <span>Follow</span>
            </button>
            <button
              className={view === 'close' ? 'selected' : ''}
              onClick={() => setView('close')}
              title="Visit memorial"
            >
              <Eye size={17} />
              <span>Memorial</span>
            </button>
          </div>
          <div className="offering-bar glass">
            <Button disabled={!!busy} onClick={() => remember('candle')}>
              <Flame size={18} />
              Light a candle
            </Button>
            <Button disabled={!!busy} onClick={() => remember('flower')}>
              <Flower2 size={18} />
              Leave flowers
            </Button>
            <Button onClick={() => setNoteOpen(true)}>
              <BookOpen size={18} />
              Leave a memory
            </Button>
          </div>
          <aside className="memory-drawer">
            <h3>A little more of their world</h3>
            <p className="small-copy">
              Turn their photo into a 3D keepsake, or create a world shaped by
              their story.
            </p>
            <div className="generation-actions">
              {(
                [
                  {
                    id: 'world',
                    name: 'Create a walkable world',
                    label: 'World Labs',
                    icon: Cloud,
                  },
                  {
                    id: 'tripo',
                    name: 'Create their 3D keepsake',
                    label: 'Tripo',
                    icon: Box,
                  },
                  {
                    id: 'mint',
                    name: 'Imagine another world',
                    label: 'Mint',
                    icon: Sparkles,
                  },
                ] as const
              ).map((p) => {
                const job = jobs.find((j) => j.provider === p.id);
                return (
                  <div className="generation-row" key={p.id}>
                    <button
                      disabled={
                        !!busy ||
                        !!job ||
                        (!cap[p.id] && island.id !== 'sample')
                      }
                      onClick={() => generate(p.id)}
                    >
                      <p.icon size={19} />
                      <span>
                        {p.name}
                        <small>
                          {job
                            ? job.status === 'complete'
                              ? 'Ready to explore'
                              : job.status === 'failed'
                                ? 'Needs attention'
                                : 'Creating · you can return later'
                            : cap[p.id]
                              ? p.label + ' · uses generation credits'
                              : island.id === 'sample'
                                ? 'Create an island to begin'
                                : 'Not connected yet'}
                        </small>
                      </span>
                      {job?.status === 'complete' ? (
                        <Check size={16} />
                      ) : job && job.status !== 'failed' ? (
                        <LoaderCircle size={16} className="spin" />
                      ) : (
                        <ArrowUpRight size={16} />
                      )}
                    </button>
                    {job?.error && <p className="job-error">{job.error}</p>}
                  </div>
                );
              })}
            </div>
            {world?.world_marble_url && (
              <a
                className="result-link"
                href={world.world_marble_url}
                target="_blank"
                rel="noreferrer"
              >
                Walk their generated world <ArrowUpRight size={16} />
              </a>
            )}
            {mintWorld?.mintUrl && (
              <a
                className="result-link"
                href={mintWorld.mintUrl}
                target="_blank"
                rel="noreferrer"
              >
                Explore their Mint world <ArrowUpRight size={16} />
              </a>
            )}
            {model?.model_url && (
              <a
                className="result-link"
                href={model.model_url}
                target="_blank"
                rel="noreferrer"
              >
                Download their 3D keepsake <Download size={16} />
              </a>
            )}
            <p className="privacy-note">
              Creating a world sends their story and reference photo to the
              selected provider. Your original garden stays here.
            </p>
            <button
              className="text-link"
              onClick={() => {
                const blob = new Blob([islandPrompt(island)], {
                  type: 'text/plain',
                });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `${island.name}-world-brief.txt`;
                a.click();
                URL.revokeObjectURL(a.href);
              }}
            >
              Download the world’s creative brief <Download size={14} />
            </button>
            <div className="memory-list">
              <h3>The memory book</h3>
              {memories.filter((m) => m.kind === 'note').length === 0 ? (
                <p>
                  Some stories are too lovely to lose.
                  <br />
                  Leave the first memory.
                </p>
              ) : (
                memories
                  .filter((m) => m.kind === 'note')
                  .map((m) => (
                    <blockquote key={m.id}>
                      {m.text}
                      <small>
                        {new Date(m.created).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </small>
                    </blockquote>
                  ))
              )}
            </div>
          </aside>
          {error && (
            <div className="visit-error error" role="alert">
              {error}
              <button onClick={() => setError('')}>Dismiss</button>
            </div>
          )}
        </section>
      )}
      <Dialog
        open={creating}
        onOpenChange={(v) => {
          if (!busy) setCreating(v);
        }}
      >
        <DialogContent className="creator">
          <div className="creator-art">
            <img src="/island.png" alt="A personal garden island" />
            {photoUrl && (
              <img
                className="creator-portrait"
                src={photoUrl}
                alt="Uploaded memorial portrait"
              />
            )}
            <div>
              <span>A WORLD OF THEIR OWN</span>
              <h2>{draft.name ? `For ${draft.name}.` : 'Love takes shape.'}</h2>
              <p>A little place for a very big love.</p>
            </div>
          </div>
          <div className="creator-form">
            <span className="step-number">0{step + 1} / 03</span>
            <DialogTitle>
              {step === 0
                ? 'Who are we remembering?'
                : step === 1
                  ? 'Tell us a little about them.'
                  : 'Where would they feel at home?'}
            </DialogTitle>
            <DialogDescription>
              {step === 0
                ? 'Every person. Every paw. Every kind of love.'
                : step === 1
                  ? 'The small things often hold the biggest memories.'
                  : 'Choose the beginning of their little world.'}
            </DialogDescription>
            <div className="steps">
              {[0, 1, 2].map((s) => (
                <span key={s} className={s <= step ? 'done' : ''} />
              ))}
            </div>
            {step === 0 && (
              <>
                <div className="kind-picker">
                  <button
                    className={draft.kind === 'person' ? 'chosen' : ''}
                    onClick={() => setDraft((v) => ({ ...v, kind: 'person' }))}
                  >
                    <UserRound size={20} />A loved one
                  </button>
                  <button
                    className={draft.kind === 'pet' ? 'chosen' : ''}
                    onClick={() => setDraft((v) => ({ ...v, kind: 'pet' }))}
                  >
                    <PawPrint size={20} />A beloved pet
                  </button>
                </div>
                <label
                  className="upload"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    void upload(e.dataTransfer.files[0]);
                  }}
                >
                  {busy === 'photo' ? (
                    <LoaderCircle className="spin" />
                  ) : photoUrl ? (
                    <img src={photoUrl} alt="Selected photo" />
                  ) : (
                    <Camera size={28} />
                  )}
                  <strong>
                    {photoUrl
                      ? 'A face you’ll always know'
                      : 'Add a favorite photo'}
                  </strong>
                  <span>
                    {photoUrl
                      ? 'Choose another photo'
                      : 'Drop it here, or click to choose'}
                  </span>
                  <small>JPG, PNG or WebP · up to 8 MB</small>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => upload(e.target.files?.[0])}
                    disabled={!!busy}
                  />
                </label>
                <label className="field">
                  Their name
                  <Input
                    value={draft.name}
                    maxLength={80}
                    placeholder={
                      draft.kind === 'pet' ? 'e.g. Mochi' : 'e.g. Grandma Rose'
                    }
                    onChange={(e) =>
                      setDraft((v) => ({ ...v, name: e.target.value }))
                    }
                  />
                </label>
              </>
            )}
            {step === 1 && (
              <>
                <label className="field">
                  A lifetime, in a few words <span>Optional</span>
                  <Input
                    value={draft.dates}
                    maxLength={80}
                    placeholder="2012 — 2025, or ‘My little forever’"
                    onChange={(e) =>
                      setDraft((v) => ({ ...v, dates: e.target.value }))
                    }
                  />
                </label>
                <label className="field">
                  What made them, them?
                  <Textarea
                    rows={6}
                    maxLength={2000}
                    value={draft.story}
                    placeholder="The sunny spot they always found. Their favorite place. The way they made you feel…"
                    onChange={(e) =>
                      setDraft((v) => ({ ...v, story: e.target.value }))
                    }
                  />
                </label>
                <p className="form-note">
                  There’s no right way to remember. A sentence is enough.
                </p>
              </>
            )}
            {step === 2 && (
              <>
                <div className="theme-picker">
                  {themes.map((t) => (
                    <button
                      key={t.id}
                      className={draft.theme === t.id ? 'chosen' : ''}
                      onClick={() => setDraft((v) => ({ ...v, theme: t.id }))}
                    >
                      <span
                        className="theme-swatch"
                        style={{ background: t.color }}
                      />
                      <span>
                        <strong>{t.name}</strong>
                        <small>{t.note}</small>
                      </span>
                      {draft.theme === t.id && <Check size={16} />}
                    </button>
                  ))}
                </div>
                <div className="form-note private-box">
                  <LockKeyhole size={18} />
                  <span>
                    Your island is private. Your photo becomes part of the
                    garden. AI generation is a separate choice after you arrive.
                  </span>
                </div>
              </>
            )}
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <div className="form-actions">
              {step > 0 ? (
                <button onClick={() => setStep(step - 1)} disabled={!!busy}>
                  <ArrowLeft size={16} />
                  Back
                </button>
              ) : (
                <span />
              )}
              <Button
                className="pill dark"
                disabled={!!busy || !draft.name.trim()}
                onClick={() => (step < 2 ? setStep(step + 1) : save())}
              >
                {busy === 'save' ? (
                  <LoaderCircle className="spin" />
                ) : step === 2 ? (
                  'Create their island'
                ) : (
                  'Continue'
                )}
                <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent className="note-dialog">
          <DialogTitle>A memory for {island.name}</DialogTitle>
          <DialogDescription>
            A small moment. A favorite story. Something you wish you could tell
            them.
          </DialogDescription>
          <Textarea
            aria-label="Your memory"
            rows={6}
            value={note}
            maxLength={2000}
            onChange={(e) => setNote(e.target.value)}
            placeholder="I’ll always remember…"
          />
          <Button
            className="pill dark"
            disabled={!note.trim() || !!busy}
            onClick={() => remember('note', note)}
          >
            Keep this memory <Heart size={16} />
          </Button>
        </DialogContent>
      </Dialog>
      {notice && (
        <div role="status" className="toast">
          <Heart size={16} />
          {notice}
        </div>
      )}
    </main>
  );
}
