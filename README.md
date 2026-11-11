# Minecraft Skin Studio

A browser-local Minecraft Java Edition 64×64 RGBA skin editor with an optional Gemini free-tier image-analysis pipeline. The private hosted Worker accepts a `GEMINI_API_KEY` server secret or a temporary key supplied by the signed-in owner for one browser session. Real-image likeness has not been tested.

## Run

```bash
npm ci
npm run dev
npm test
npm run build
npm run test:worker
```

The editor needs no API key. `npm run build` bundles a Cloudflare Worker at `dist/server/index.js` for Sites. It serves the app and provides `/api/ai/status` and `/api/ai/generate`. The Site remains private; the API requires authenticated user identity. Prefer `GEMINI_API_KEY` as a hosted secret for an **unbilled free-tier** Google AI Studio project. Until then, the owner can paste a key into the site input. It stays in React memory only, is sent to the authenticated Worker for an explicit generation request, and is lost on reload. It is never embedded in the app bundle, saved by the browser, or returned in responses. The deployed Worker does not read `OPENAI_API_KEY` and has no paid-provider fallback. `/api/ai/status` reports only server-secret presence; a temporary key is verified by an actual generation request.

## Implemented

- Strict 64×64 PNG import (PNG signature and dimensions) and RGBA PNG export
- Explicit Classic/Steve (4 px) and Slim/Alex (3 px) UV rectangles, 6 faces × 6 parts × 2 layers
- Body part and layer selection; integer-pixel pen, eraser, eyedropper, face-confined flood fill, color picker, zoom, grid, and region reset
- Enlarged selected-face editor, expandable full UV atlas, draggable desktop divider, color wheel, saturation/value square, RGBA/HSVA channels, 8-digit HEX and overlay alpha
- 40-step stroke undo/redo, browser-local autosave and restore
- `skinview3d` rendering from the **same 64×64 canvas data used for export** when WebGL is available
- PNG-derived Canvas cuboid renderer when WebGL is unavailable (drag, wheel/pinch, front/back/side/top views, idle/walk/run)
- Steve/Alex model toggle, outer-layer toggle, Korean responsive workspace

The initial project opens with a plain guide skin. The example character is available from the Example button. The full 64×64 atlas is the primary editor; clicking any mapped face selects its part and layer, and the selected face can be expanded for closer work. Up to 12 actually painted colors are remembered locally, most recent first. The 64×64 PNG itself does not encode Classic/Slim model choice. Choose the same model in the Minecraft upload UI. Changing models in the editor reinterprets the current texture; it does not convert an existing skin's arm pixels.

## AI generation status

The private Worker can send a compressed reference image to Gemini 2.5 Flash for structured hair, eyes, clothing, color roles and inferred back/sides. It validates the response and assembles an actual 64×64 RGBA UV texture through a deterministic template. These pixels enter the same preview, undo and PNG export flow. The endpoint checks image signature and size, authenticated identity, a five-per-hour per-isolate limit and a 45-second timeout. Free-tier quota exhaustion stops with an error; it never switches to a paid model. **A live Gemini key and real-image likeness tests remain outstanding.** The assembler has limited hair/outfit templates and does not provide face candidates or preservation locks. Its per-isolate in-memory quota is insufficient for unrestricted public AI access. Google may use free-tier inputs and outputs to improve its products; do not upload sensitive images.

## Older loopback-only analysis adapter

`STUDIO_SERVER_TOKEN=<long-random-token> OPENAI_API_KEY=<provider-key> npm run server` starts a loopback-only HTTP service. Authenticated `POST /v1/analyze` accepts `{ "mime": "image/png", "base64": "..." }`, validates the image signature and a 5 MB bound, then requests a structured character description from the OpenAI Responses API. `/health` returns only whether a provider key exists. This service **does not generate a skin**, and it is deliberately not deployed or exposed publicly. Do not put either secret in browser code. Production needs real user authentication, per-user quotas, pixel-dimension checks, consent, durable cost caps, and a separate hosting decision before this endpoint is used.

## Known scope and limitations

- The generation pipeline is tested with a mocked Gemini response only. Actual AI generation requires an unbilled free-tier key and real-image tests. Face candidates, semantic masks and AI region locks are not implemented.
- Symmetry painting is not implemented. UV atlas-wide x reflection is incorrect for paired limbs; implement face-aware correspondence before enabling it.
- The software Canvas renderer is a fallback with orthographic projection; the canonical WebGL path uses `skinview3d`. Actual game import and real WebGL rendering were not verified in the managed test browser, which disabled WebGL.
- Browsers can normalize hidden RGB underneath fully transparent pixels when importing a PNG through Canvas. Visible RGBA pixels survive tested import/export; transparent RGB byte fidelity and PNG metadata/compression bytes are not guaranteed.
- LocalStorage is per browser/device and can be cleared by the user or browser. Download PNG for lasting backups.
- A reference image stays in the browser until the user requests AI generation. That request sends a resized image to the private Worker and Gemini; the Worker does not persist it. Reference images are not retained by autosave.

## Design and next stages

See [architecture and roadmap](docs/ARCHITECTURE.md), [QA evidence](docs/QA.md), and [dependency review](docs/REFERENCES.md). Next: connect a free-tier key, evaluate real images and face quality, add locked pixel masks and independent face candidates, then harden durable quotas before public AI access.

## License

Project code is MIT licensed. `skinview3d` is MIT licensed and its notice is included in `public/skinview3d-LICENSE.txt`. Other npm dependencies are resolved from their published packages; retain their notices in redistribution.
