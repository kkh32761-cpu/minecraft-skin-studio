# Technology and competitor review · 2026-11-11

| Project | Public evidence | Decision |
| --- | --- | --- |
| [skinview3d](https://github.com/bs-community/skinview3d) | MIT source, `setSkinUVs`, Slim/Classic models, `loadSkin`, animations | Used for canonical WebGL PNG renderer; retain MIT notice. |
| [img2skin](https://github.com/sei-studio/img2skin) | MIT source describes Gemini front/back panel followed by deterministic UV mapping, validation and a generic color-template fallback; quoted cost/latency are maintainers' claims | Architecture reference only. No code copied, no inferred quality claim; generic fallback must not be called AI likeness. |
| [SpriteSkin](https://spriteskin.com/image-to-minecraft-skin) | Vendor describes front/side/back generation, face work, 64×64 output and editor | Marketing claim only; code and same-input output were not inspected. |
| [Photo2Skin](https://photo2skin.com/) | Vendor advertises 64×64 output and editor | Marketing claim only; private implementation unknown. |

Minecraft's [official skin help](https://www.minecraft.net/en-us/article/how-change-your-skin-minecraft-java-edition) distinguishes Classic and Slim arms. Exact UV rectangles here were cross-checked against the open `skinview3d` model implementation because the official help does not document every atlas coordinate. No competitor result was generated in this phase, so no quality ranking is made.
