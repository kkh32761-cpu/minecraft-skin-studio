# AI generation reliability and quality audit — 2026-11-11

## Ground truth
- The canonical deliverable is a Minecraft Java 64×64 RGBA PNG, not a high-resolution illustration, custom model or shader-enhanced render.
- The user reference is a soft-lit, high-detail 3D character presentation. A vanilla Steve/Alex skin cannot reproduce its non-cubic geometry, soft shadows or additional modeled hair/garment volume. Grade **texture craftsmanship** separately from **presentation rendering**.
- The current Gemini 3.8 Flash endpoint is an **image-understanding** model (text output). It does not generate an image. Nine observed palette roles and four outfit classes still constrain the deterministic UV assembler. A cleaner assembly pass is a polish improvement, **not** evidence of photographic/illustration likeness.
- Work and GitHub CI tests mock the provider. There is no verified live-key generation benchmark in this repository. Do not advertise "production-ready AI" or guaranteed reference likeness based on unit tests.

## Implemented in this revision
1. Retry timeout/temporary transport failures as well as HTTP 500/502/503/504. Limit to two retries (three attempts), with bounded backoff. HTTP 429/auth/content errors do not trigger paid-provider fallback.
2. Record exact provider-attempt stage events as NDJSON for browsers that request it. Existing JSON clients remain supported. Events are **preparing**, **analyzing**, **retrying** with attempt and reason, **assembling**, **complete**, or **error**. Do not use fictional percent-complete figures.
3. Keep the reference upload, settings and previous skin intact when generation fails. Browser feedback differentiates timeout, server overload and quota.
4. Remove periodic noise from the deterministic UV assembler; add intentional layered bangs/hair strands, cheeks, garment lapels/buttons, cuff/boot details, and cooler restrained shading. Continue enforcing model-specific UV widths.
5. Rework the original demo's silver-hood/ice-blue palette and regenerate its static 64×64 sample PNG.
6. Add regression checks for streamed progress, explicit quota errors and repeated transport timeouts.

## Still unsolved — must not be described as complete
- The input image is never translated into pixel-level component geometry or semantically locked regions. Accessory, hairstyle and clothing fidelity remain sharply limited by enumerations.
- Neither Gemini's real output under an owner key nor the deployed ChatGPT Site can be validated by these mocked tests. Request performance, rate limits and live provider availability are external.
- Existing per-isolate in-memory user quota is not durable across Worker instances or restarts. It is not sufficient for unrestricted public access.
- A single synchronous generation task can still fail if the upstream service stays unavailable. Automatic retry reduces transient errors; it cannot guarantee zero errors.
- The 3D viewer deliberately renders exactly the PNG data. Adding independent geometry to imitate the reference would misrepresent the exported Minecraft skin.

## Proposed high-fidelity generation engine (not implemented)
**Stage 1 — establish a baseline:** collect consented image categories (photos, anime, virtual avatars, existing Minecraft skins, front-only and multi-view references). For each, store expected hair shapes, head accessories, eye layout, layered outfit, color groups, UV model choice, known versus inferred sides. Build reference-vs-64×64 exports and actual Minecraft import screenshots.

**Stage 2 — structured composition:** expand from 9 colors / 4 outfits to semantic design layers: hair silhouette with strand/gradient direction; face/eyes/brows/blush; collar/neckwear; garment panels/closures/hem; sleeves/cuffs; shoes; accessories. Preserve observables; explicitly mark unseen side/back as hypotheses.

**Stage 3 — per-face candidate design:** request multiple bounded pixel-art proposals for face-sized indexed-color masks (8×8 head, 8×12 torso, 3–4×12 limbs), not one freeform 64×64 image. Quantize and validate against official UVs, preserve transparency rules, layer order and palette harmony; reject invalid masks and preserve independent 2nd-layer transparency. Implement face-aware limb correspondence, explicit user-approved edits and lock masks.

**Stage 4 — quality gates:** compare proposed candidates with input using both semantic similarity and design appeal. Include consistency between faces, connected pixel clusters, palette contrast and editability. Judge several candidates blind against the current template and a hand-authored skin. Target a clear majority preference across a diverse evaluation set **before** claiming superior quality.

**Stage 5 — production:** persistent task status and idempotency, durable per-user quotas, cancellation, cost caps and secret management, privacy/retention notices, retry budget, authenticated browser/device QA and real game import.

## Acceptance criteria
- Exact exported PNG pixels equal the viewer input; UV never overlaps and follows Classic/Slim arm dimensions.
- A failed provider request never silently replaces an existing skin or deletes the reference upload.
- UI reports real attempt state, not a fabricated progress percentage.
- CI passes; separate manual QA still required for visual quality, WebGL and hosted deployment.
- Claims about original-image resemblance require actual comparative evaluation, not mock JSON alone.
