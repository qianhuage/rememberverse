# Meta Cemetery — submission and presentation kit

A little island for a lifetime of love. Photos and memories of people and pets become personal, explorable memorial gardens.

## Track

Primary: Gaming & Interactive Worlds — a complete interactive loop: create a memorial → explore the island → leave a candle, flower, or memory → return to see it saved.
Secondary fit: Creative 3D & VFX — cinematic floating archipelago, generated spatial worlds, PBR keepsakes, and memorial character design.
This is not a robotics or Physical AI project; do not claim that track simply to cover more categories.

Source: [Spatial Intelligence Hackathon Resources](https://app.notion.com/p/fdotinc/Spatial-Intelligence-Hackathon-Resources-3ce7344e43da80e1a310d424f0b4c3bd), September 5, 2026, San Francisco. Resource page requests a two-minute presentation. [Submission page](https://app.notion.com/p/fdotinc/Submissions-3d27344e43da80c1ac1ddcced1cc221f?pvs=25). No submission has been sent.

## Two-minute presentation

0:00–0:15 — “We have thousands of photos of the people and pets we love, but nowhere that feels like being with their memory. Meta Cemetery gives every love a place.”

0:15–0:35 — Open the sanctuary. Enter the pre-generated demo world and move the camera through the garden. “An island for every story. A world you can return to.”

0:35–1:00 — Create an island. Upload a photo you have permission to use, name the person or pet, write one specific memory, and choose an atmosphere. “This is Mochi. His favorite place was wherever the sunlight landed.”

1:00–1:25 — Enter the island, orbit around the memorial pavilion and companion, move closer, light a candle, leave flowers, and save a short note. Show the memory book. Return to My islands and reopen it to prove persistence.

1:25–1:45 — Show the pre-generated immersive world or 3D keepsake. Explain the exact provider used for the displayed asset. New generations run asynchronously and persist their operation IDs; the live presentation uses prepared outputs.

1:45–2:00 — “This isn’t about replacing someone. It’s a place to keep loving them.” Explain the next step: shared family access and real-time visits with explicitly controlled privacy.

## Implementation and honest attribution

- Three.js: original interactive island environment, orbit/close cameras, memorial architecture, companion fallback, candle/flower state.
- Spark: in-app Gaussian splat renderer and keyboard/touch exploration of generated worlds.
- World Labs Marble: server-side world generation, photo media-asset upload, durable operation polling, world/splat retrieval.
- Mint: live world generation, generated companion model preparation, world retrieval and viewer link.
- Tripo: server-side photo/text-to-model upload and polling integration. Verify account generation permissions/credits before claiming a successful Tripo-generated demo asset.
- Convex: optional authenticated event bridge and schema are included. No Convex deployment was provided in the reused configuration. Do not claim live Convex multiplayer until it is deployed and connected.
- Cloudflare D1/R2: actual saved islands, memory events, generation jobs, and private photo bytes.
- Imagegen: generated sanctuary and island still artwork used in the landing and creation experience.

## Demo reliability

Use the saved generated world from public/demo-world.json. This is pre-generated spatial content, not a live generation claim. Do not wait for provider generation during the two-minute pitch. Keep the original interactive island available as a fallback if a network or WebGL issue affects the immersive world.

## Design references

- User's Figma: https://www.figma.com/design/sSX3ZNamUCcCMEt33Qw4zp/METACEMETRY?node-id=0-1 — intimate islands, memorial spaces, character customization.
- Remember Metaverse: https://x.com/RememberNFT — floating limestone archipelagos, classical stone halls, cypress trees, sunlit clouds.
- Memorial Stones: https://nftcalendar.io/event/memorial-stones/ — sculptural marble stones, metallic orbit rings, pearl-like light.

No blockchain, NFT sale, or financial workflow is necessary for this prototype. Remember is an aesthetic reference; Meta Cemetery uses its own generated artwork and authored 3D environment.
