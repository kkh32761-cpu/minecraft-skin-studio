# QA record · 2026-11-11

## Revision 0.3

- The full 64×64 atlas is visible by default. Clicking the body front in the atlas automatically selected Body and painted the pixel; the selected face remains available as an optional enlarged panel.
- The plain guide skin rendered as a neutral basic model after pressing Basic. A new visitor starts with it; an unmodified previous example autosave upgrades to the guide, while changed work remains restorable.
- Painting with two distinct HEX colors added recent color buttons in order `#112233`, `#5e3e58`; colors are bounded to 12 and stored in browser local storage. Old fixed swatches were removed.
- `npm test`, `npm run build`, `npm run test:worker` passed after these changes. Live AI still has no configured provider key, so the generated likeness path remains unverified.

## Revision 0.2

- The preset zoom bug came from `OrbitControls.reset()` restoring a camera at the model origin. Presets now set a safe camera radius. Managed browser showed rear and top hair after clicking their controls without oversized zoom. WebGL visual verification remains pending.
- Desktop splitter drag changed preview/editor widths from 425/668 px to 308/785 px. Selected head face uses 8×8 pixels at 38 px each; zoom range is 16–64 px per pixel. Full UV atlas expands separately to 32×.
- Initial project shows a textured face, hair, outfit and shoes. An exact untouched legacy mannequin autosave upgrades to this example; altered saved work is preserved.
- RGBA numeric input changed the HEX value; clicking the face enabled Undo and increased the preview revision; Undo restored the prior state. HSVA controls appeared. Alpha is enabled only on overlay. PNG alpha roundtrip through this new control still needs browser validation.
- `npm test`: 6 frontend UV/character cases and 3 legacy local analysis cases passed. `npm run build`: TypeScript/Vite/Worker bundle passed. `npm run test:worker`: static serving, missing-key and authentication refusal, and authenticated image → **mocked** provider response → 64×64 UV pixels passed. No live provider request or likeness comparison was made.
- The Worker stores no uploaded image. Its per-user quota is in memory per isolate only, insufficient for unrestricted public access.

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
