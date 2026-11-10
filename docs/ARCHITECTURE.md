# Architecture decision record · 2026-11-11

## Decisions

1. **Source of truth**: one 64×64 `Uint8ClampedArray` of RGBA pixels. The editor, `skinview3d`, fallback renderer and PNG exporter all read this same array. The UV editor's grid and outlines are visual overlays and never exported.
2. **UV mapping**: `src/skin.ts` encodes separate Classic/Slim rectangles for head, body, paired limbs and their outer layers. These coordinates were cross-checked against `skinview3d`'s `setSkinUVs` and automated overlap/boundary tests. Steve/Alex is editor state, not a PNG metadata field.
3. **Rendering**: `skinview3d` is the canonical Three.js WebGL renderer. A separate Canvas cuboid renderer uses atlas pixels for WebGL-disabled environments. It does not introduce extra 3D accessories absent from the texture.
4. **Persistence**: browser-local RGBA base64 snapshot and model choice; bounded 40-entry in-memory edit history. Reference images stay in the browser until the user explicitly requests AI generation; then the compressed image is sent to the Worker and model provider, and neither server nor UI autosave retains it.
5. **AI boundary**: a private Worker endpoint calls the provider only when `OPENAI_API_KEY` is configured. It validates the structured visible/inferred `CharacterSpec`, maps palette roles to deterministic per-part UV pixels in `src/character.ts`, then returns RGBA data to the regular editor/preview/export path. This is a limited template engine, not a quality-verified likeness system. A future lock mask must be applied after proposed pixels and before final structural validation.
6. **Workspace usability**: a draggable center/right splitter changes CSS grid columns; a focused single-face canvas shares the atlas RGBA array with the expandable full UV view. Color is an explicit RGB/HSV + alpha state; base-layer painting is opaque.

## Proposed next AI service interface (not implemented)

`POST /v1/jobs`: authenticated user, reference image, model, style controls, cost quote/consent. Returns job ID. Image validation limits byte size, decoded pixels, MIME signature and orientation; temporary originals have explicit retention.

`GET /v1/jobs/:id`: bounded state `queued|analyzing|designing|pixelating|validating|done|failed`, timeout and safe error. Idempotent retry and per-user quotas.

`POST /v1/jobs/:id/regions`: selected region and immutable mask hashes. Server returns candidate RGBA rectangles and provenance, not a flattened preview. Client merges only allowed UV cells. Unseen sides are flagged inferred.

The older loopback adapter uses `OPENAI_API_KEY` and `STUDIO_SERVER_TOKEN`. The Worker secret is configured separately. It is currently absent; the AI button is disabled rather than pretending to generate. The Site must remain private until durable rate/cost limits, real-key image tests and a privacy policy are in place.

## Cross-review

| Perspective | Decision / discovered issue | Resolution / evidence |
| --- | --- | --- |
| Development lead + QA | 64×64 PNG has no Slim flag | The UI explicitly tells the user to choose the matching model on game upload. |
| 3D + QA | Preview must be exported pixels | Both renderers read `canvasFromData(data)` or `data`; browser export/import round trip compared pixel equal. |
| Pixel art + 3D | Slim arms shift face boundaries | Separate 3 px UV rectangles; automated front/right edge assertions. |
| AI + pixel art | A model-drawn full UV atlas can drift | Structured visible/inferred traits and deterministic 64×64 assembly now exist; actual image quality is unverified and face candidate design remains future work. |
| Pixel art + QA | Tiny atlas pixels and 16 preset swatches constrained editing | Focused face canvas up to 64 px per source pixel, wheel, saturation/value, RGBA/HSVA and 8-digit HEX; browser paint/undo check passed. |
| 3D + QA | Preset reset put camera inside model | Removed `controls.reset()`, set known camera radius; fallback rear/top visual checks passed. WebGL still requires external verification. |
| QA + lead | WebGL disabled in test browser | Canvas-derived fallback added, tested front/back and slim; canonical WebGL unverified here. |
| QA + lead | Exported file without extension has empty MIME | PNG signature validation replaces MIME-only rejection; browser import retested. |

## Next work

1. Secure AI provider key connection, real-image evaluation and durable quotas/cost controls. The current template assembler is not a validated high-fidelity AI result.
2. Semantic pixel masks and face-aware limb symmetry; then region locks and conflict previews.
3. Face design engine: 8×8 base face plus overlay hair; 3–5 independent eye/bang candidates; blinded human ranking for resemblance and pixel-art appeal separately.
4. Integration tests in a WebGL-enabled desktop/mobile browser and actual Java launcher import. Six image categories, including the black-hair/red-eye reference when supplied, evaluated with same-input competitor baselines.
5. Public hosting/authentication/privacy/cost policy. The current Site remains private; it is now Worker-backed.
