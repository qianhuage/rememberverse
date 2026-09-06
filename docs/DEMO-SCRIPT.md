# Meta Cemetery — 2-Minute Demo Script

**Format:** ~2 minutes, one browser window, sound off. Quiet delivery — this demo
wins on feeling, not speed. Slow down where Lastcall speeds up.

---

## Before you go on (10 minutes ahead)

- [ ] `npm run dev -- --port 3100` running; hard-refresh once.
- [ ] Confirm the pre-generated world loads from `public/demo-world.json`.
- [ ] Have one photo ready that you have permission to use (a pet lands best).
- [ ] Pre-create one island ("Mochi") so persistence is provable without typing live.
- [ ] Keep the authored three.js island ready as fallback if the splat world stalls.
- [ ] Do **not** trigger live generation on stage — everything shown is prepared.

---

## 0:00 — The why

*(Landing page on screen. Don't click yet.)*

> "We have thousands of photos of the people and pets we love —
> and nowhere that feels like *being with* their memory.
> **Meta Cemetery gives every love a place.**"

## 0:15 — The sanctuary

**Do:** open the pre-generated demo world. Drift the camera slowly through the garden.

> "An island for every story. Classical pavilion, cypress trees, a pond that
> remembers the sky. A world you can return to."

## 0:35 — Creating one

**Do:** walk the three-step creator with the prepared photo.

> "Three steps: a photo, a name, one specific memory."

*(Type or show the memory line — say it out loud, slowly:)*

> "This is Mochi. His favorite place was wherever the sunlight landed."

## 1:00 — Being there

**Do:** enter the island. Orbit the pavilion, move close to the portrait and companion.
**Light a candle. Leave flowers. Save a short note.** Open the memory book.
Then go back to *My islands* and **reopen it**.

> "You don't just look at it — you visit. Candles, flowers, a memory book.
> And when you come back... it's all still here. That's the whole point."

*(The reopen is the proof beat — persistence is the product.)*

## 1:25 — The generated world

**Do:** open the pre-generated immersive splat world (Spark viewer), walk a few steps.

> "The islands themselves are generated — this world came from **World Labs Marble**
> [or **Mint**, whichever produced the shown asset — name the real one], explored
> in-browser with **Spark** Gaussian splats. And the memorial itself can become a
> 3D keepsake you keep." *(show the GLB keepsake if loaded)*

## 1:45 — Close

**Do:** return to the island, camera resting on the candle.

> "This isn't about replacing someone. It's a place to keep loving them.
> Next: shared family visits — same island, explicitly controlled privacy.
> **Meta Cemetery. Every love gets a place.**"

---

## Honesty guardrails (from the presentation kit — do not break these)

- Say which provider actually generated the asset on screen; don't blur attribution.
- Don't claim live Convex multiplayer (bridge included, not deployed).
- Don't claim a Tripo-generated asset unless one actually succeeded on this account.
- Live generation is asynchronous with durable job IDs — say "pre-generated for the
  demo," never pretend it just happened.

## If something breaks

| Symptom | Move |
|---|---|
| Splat world won't load | Stay in the authored three.js island — it carries the demo alone |
| Photo upload hiccup | Use the pre-created Mochi island; creation flow is skippable |
| WebGL context loss | Refresh once; the D1-persisted island reopens instantly — narrate that as the feature it is |

**Track:** Gaming & Interactive Worlds (primary) — complete loop: create → explore →
leave candle/flower/memory → return, persisted. Creative 3D & VFX secondary.
