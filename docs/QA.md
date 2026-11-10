# QA record · 2026-11-11

## Passing checks

- `npm test`: 4 frontend test cases and 3 local analysis adapter tests (signature/size, missing-key refusal, mocked provider schema request/response) covering 72 atlas faces per model without overlap, official coordinate fixtures (head/body/limbs, Classic and Slim), integer edit/flood boundaries, opaque base and transparent overlay sample, dimension rejection.
- `npm run build`: TypeScript and Vite production build passed.
- Local analysis HTTP process: `/health` returned 200 with `ready:false`; unauthenticated analysis returned 401; authenticated analysis without provider key returned 503. No paid provider request was made.
- Managed browser: example skin visibly rendered from PNG pixels in Canvas fallback; pixel edit changed revision and enabled undo; Alex selection narrowed arm rendering; back view displayed back textures; download produced 64×64 8-bit RGBA PNG.
- Exported sample was imported after a blank canvas and re-exported. Pillow byte comparison of decoded RGBA pixels: **equal**; 1,858 nontransparent pixels.
- Import initially rejected extensionless downloaded PNG due to MIME-only check. Fixed with eight-byte PNG signature check; re-import succeeded.

## Not yet verified

- `skinview3d` WebGL path visually and interactively in this managed browser; browser logged WebGL disabled by sandbox. Code type-checks and uses documented `loadSkin(canvas,{model})` API.
- Actual Minecraft Java launcher import, mobile touch hardware, Safari/Firefox, transparent RGB roundtrip on arbitrary imported files, high-resolution upload resource behavior beyond checks.
- Quality and likeness from any input image: automatic AI processing has not been implemented.

## Reproduction

`npm ci && npm test && npm run build && npm run dev`. Import `public/sample-skin-steve.png`, paint a head pixel, rotate the 3D view, download PNG, import it again, and compare RGBA pixels. The fallback is automatically selected when WebGL context creation fails.
