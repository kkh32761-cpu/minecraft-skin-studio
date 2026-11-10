# Architecture decision record · 2026-11-11

## Decisions

1. **Source of truth**: one 64×64 `Uint8ClampedArray` of RGBA pixels. The editor, `skinview3d`, fallback renderer and PNG exporter all read this same array. The UV editor's grid and outlines are visual overlays and never exported.
2. **UV mapping**: `src/skin.ts` encodes separate Classic/Slim rectangles for head, body, paired limbs and their outer layers. These coordinates were cross-checked against `skinview3d`'s `setSkinUVs` and automated overlap/boundary tests. Steve/Alex is editor state, not a PNG metadata field.
3. **Rendering**: `skinview3d` is the canonical Three.js WebGL renderer. A separate Canvas cuboid renderer uses atlas pixels for WebGL-disabled environments. It does not introduce extra 3D accessories absent from the texture.
4. **Persistence**: browser-local RGBA base64 snapshot and model choice; bounded 40-entry in-memory edit history. Reference images do not leave the browser and are not saved. A local-only authenticated analysis adapter exists in `server/`; no backend is deployed. The adapter returns a validated `CharacterSpec` but does not assemble skin pixels.
5. **AI boundary**: the unconnected local server calls a real provider only when keys are configured; future UI calls an authenticated deployed backend. Provider adapters should emit a validated `CharacterSpec` (observable vs inferred attributes), front/back/side design, then deterministic per-part pixel arrays. Generation never writes a free-form UV image directly. A lock mask is applied after proposed pixels and before final structural validation.

## Proposed AI service interface (not implemented)

`POST /v1/jobs`: authenticated user, reference image, model, style controls, cost quote/consent. Returns job ID. Image validation limits byte size, decoded pixels, MIME signature and orientation; temporary originals have explicit retention.

`GET /v1/jobs/:id`: bounded state `queued|analyzing|designing|pixelating|validating|done|failed`, timeout and safe error. Idempotent retry and per-user quotas.

`POST /v1/jobs/:id/regions`: selected region and immutable mask hashes. Server returns candidate RGBA rectangles and provenance, not a flattened preview. Client merges only allowed UV cells. Unseen sides are flagged inferred.

The current local adapter uses `OPENAI_API_KEY` and `STUDIO_SERVER_TOKEN` environment variables. Provider keys reside in server secrets. Launch requires a real provider key, billing/cost cap, rate limits, auth, privacy policy and six-category same-input quality tests. No imitation AI button is exposed now.

## Cross-review

| Perspective | Decision / discovered issue | Resolution / evidence |
| --- | --- | --- |
| Development lead + QA | 64×64 PNG has no Slim flag | The UI explicitly tells the user to choose the matching model on game upload. |
| 3D + QA | Preview must be exported pixels | Both renderers read `canvasFromData(data)` or `data`; browser export/import round trip compared pixel equal. |
| Pixel art + 3D | Slim arms shift face boundaries | Separate 3 px UV rectangles; automated front/right edge assertions. |
| AI + pixel art | Prompting a model for a full UV atlas drifts | Future structured front/back design and deterministic assembly; current AI status marked absent. |
| QA + lead | WebGL disabled in test browser | Canvas-derived fallback added, tested front/back and slim; canonical WebGL unverified here. |
| QA + lead | Exported file without extension has empty MIME | PNG signature validation replaces MIME-only rejection; browser import retested. |

## Next work

1. AI backend/provider evaluation with real key, terms, quotas and cost controls. A generic recolored template may be offered only as a clearly named deterministic style, never as AI likeness.
2. Semantic pixel masks and face-aware limb symmetry; then region locks and conflict previews.
3. Face design engine: 8×8 base face plus overlay hair; 3–5 independent eye/bang candidates; blinded human ranking for resemblance and pixel-art appeal separately.
4. Integration tests in a WebGL-enabled desktop/mobile browser and actual Java launcher import. Six image categories, including the black-hair/red-eye reference when supplied, evaluated with same-input competitor baselines.
5. Public hosting/authentication/privacy/cost policy. The current Site is private and static.
