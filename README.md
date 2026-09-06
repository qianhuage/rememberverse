# Meta Cemetery

An independent memorial-island product and spatial hackathon demo. Built separately from Vibetail, reusing only the authorized provider configuration and relevant integration patterns.

## Run

```sh
npm install
npx wrangler d1 execute site-creator-d1 --local --file drizzle/0000_sudden_flatman.sql --config wrangler.local.json
npm run dev -- --port 3100
```

Copy `.env.example` to `.dev.vars` and supply server-only provider keys. Never commit either `.dev.vars` or `.env`. Production secrets are stored through Sites.

## What works

- Private photo upload to R2 with format, magic-byte and 8 MB size validation.
- Three-step island creator for people and pets.
- Saved island library, memory book, candles, and flowers in D1.
- Three.js island with classical memorial pavilion, cypress trees, blossom tree, reflective pond, memorial sculpture, portrait, and companion.
- Generated GLB keepsake loading and download.
- World Labs and Mint asynchronous world generation, persistent job IDs and result retrieval.
- Spark Gaussian-splat immersive exploration with keyboard/touch controls.
- Pre-generated demo content, where configured in `public/demo-world.json`.

## Privacy and limits

The Sites deployment is owner-only. Within the prototype, an HttpOnly, SameSite cookie isolates records and photo access. Clearing browser cookies loses access to that session's islands; account recovery and cross-device login are not implemented. Do not make this prototype public without account authentication and per-user rate limits. AI creation explicitly sends the selected photo and/or story to the named provider. Personal photos never use a public image URL.

Generation is one durable job per island/provider, preventing repeated button presses from incurring duplicate requests. Failed jobs retain their diagnostic state. No automatic repeated paid generations occur. Provider availability and credits are external dependencies. Demo assets are prepared ahead of presenting.

Convex source is optional: deploy `convex/`, set the same `CONVEX_BRIDGE_SECRET` in Convex and Sites, and set `CONVEX_URL` to the Convex deployment URL. D1 is authoritative. This prototype does not claim live multiplayer.

## Validation

`node scripts/test-api.mjs` checks upload validation, persistence, and cross-session authorization against the local server. Add `--generate` only when intentionally spending provider generation credits. `npx tsc --noEmit` checks types; `npm run build` builds the Worker and client. Full browser visual QA is not claimed unless performed.

See [the presentation kit](docs/HACKATHON.md) for track fit, a two-minute script, demo reliability, and accurate provider attribution.
