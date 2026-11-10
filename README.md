# Minecraft Skin Studio

A working browser-local Minecraft Java Edition 64×64 RGBA skin editor. **Version 0.1 is a manual editor, not an AI generator.** The reference-image upload is for side-by-side visual guidance only.

## Run

```bash
npm ci
npm run dev
npm test
npm run build
```

The static `dist/` build can be hosted on Sites or GitHub Pages. No account, API key, or server is needed for editing. A separate, undeployed analysis adapter can be run locally with `STUDIO_SERVER_TOKEN` and `OPENAI_API_KEY`; see below.

## Implemented

- Strict 64×64 PNG import (PNG signature and dimensions) and RGBA PNG export
- Explicit Classic/Steve (4 px) and Slim/Alex (3 px) UV rectangles, 6 faces × 6 parts × 2 layers
- Body part and layer selection; integer-pixel pen, eraser, eyedropper, face-confined flood fill, 16-color palette, zoom, grid, and region reset
- 40-step stroke undo/redo, browser-local autosave and restore
- `skinview3d` rendering from the **same 64×64 canvas data used for export** when WebGL is available
- PNG-derived Canvas cuboid renderer when WebGL is unavailable (drag, wheel/pinch, front/back/side/top views, idle/walk/run)
- Steve/Alex model toggle, outer-layer toggle, Korean responsive workspace

The 64×64 PNG itself does not encode Classic/Slim model choice. Choose the same model in the Minecraft upload UI. Changing models in the editor reinterprets the current texture; it does not convert an existing skin's arm pixels.

## Optional local AI analysis adapter (not connected to UI)

`STUDIO_SERVER_TOKEN=<long-random-token> OPENAI_API_KEY=<provider-key> npm run server` starts a loopback-only HTTP service. Authenticated `POST /v1/analyze` accepts `{ "mime": "image/png", "base64": "..." }`, validates the image signature and a 5 MB bound, then requests a structured character description from the OpenAI Responses API. `/health` returns only whether a provider key exists. This service **does not generate a skin**, and it is deliberately not deployed or exposed publicly. Do not put either secret in browser code. Production needs real user authentication, per-user quotas, pixel-dimension checks, consent, durable cost caps, and a separate hosting decision before this endpoint is used.

## Known scope and limitations

- Automatic AI generation, face candidate generation, semantic hair/face/clothing masks and AI region locks are **not implemented**. An uploaded reference image is not analyzed or converted.
- Symmetry painting is not implemented. UV atlas-wide x reflection is incorrect for paired limbs; implement face-aware correspondence before enabling it.
- The software Canvas renderer is a fallback with orthographic projection; the canonical WebGL path uses `skinview3d`. Actual game import and real WebGL rendering were not verified in the managed test browser, which disabled WebGL.
- Browsers can normalize hidden RGB underneath fully transparent pixels when importing a PNG through Canvas. Visible RGBA pixels survive tested import/export; transparent RGB byte fidelity and PNG metadata/compression bytes are not guaranteed.
- LocalStorage is per browser/device and can be cleared by the user or browser. Download PNG for lasting backups.
- No server upload occurs; the reference image stays in this browser session and is not retained by autosave.

## Design and next stages

See [architecture and roadmap](docs/ARCHITECTURE.md), [QA evidence](docs/QA.md), and [dependency review](docs/REFERENCES.md). The UI and deterministic skin engine are separate from any future AI backend. The next AI service must validate model output as structured character attributes and bounded region pixels, assemble UV deterministically, and preserve locked pixel masks. API keys must remain server-side, with authentication, request limits, cost caps, timeouts and explicit user consent for sending reference images to a model provider. No provider credentials are configured in this version.

## License

Project code is MIT licensed. `skinview3d` is MIT licensed and its notice is included in `public/skinview3d-LICENSE.txt`. Other npm dependencies are resolved from their published packages; retain their notices in redistribution.
