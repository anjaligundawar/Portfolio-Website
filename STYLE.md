# Portfolio style guide (from sylvy, 2026-10-07)

Layout note: the start page uses a single-face handheld (Switch Lite shape), not a two-screen DS.

Every section of the site follows this. Tokens live in `css/tokens.css`.

## Art style
"Kawaii retro-gaming streetwear print" + 8-bit arcade typography:

1. Palette: pink + violet + lavender on dark backgrounds. No other hues.
   Depth comes from light vs. dark steps of these colors.
2. Texture: grainy screen-print / risograph feel. Shadows fade into the background
   through speckled noise, not smooth gradients (SVG feTurbulence noise overlay at low opacity).
3. Extruded "floating panels": cards, buttons and windows have a flat front face plus a
   thick solid side/bottom edge (hard offset box-shadows, no blur).
4. Shape-based, minimal outlines: elements separated by color blocks; thin dark lines only
   for small icon details.
5. Retro UI motifs: window title bars with — ▢ ✕ buttons, notification dots, "!!!" badges,
   chat bubbles, media-player controls, "START" / "loading..." screens, tiny 4-point sparkles.
6. No Japanese text anywhere (sylvy, 2026-10-07: removed from the original guide).
7. Layout: centered and symmetrical. Big pixel headline on top, floating icon panels around
   a central hero illustration.
8. Mood: cozy, playful, late-night gamer desk vibes.

## Typography
Chunky 8-bit pixel lettering with a thick dark outline and a two-tone fill (light main color +
one darker shading step inside). Crisp pixels, no smoothing.

- Hero headline: "Pixelify Sans" 700, large, mixed case
- Section titles/nav: "Silkscreen" 700, all caps
- Small UI / status: "VT323" (e.g. blinking "loading...")
- Body paragraphs: "M PLUS Rounded 1c" 500

Outline technique: stacked hard text-shadows (no blur) in all 8 directions, plus a small inner
offset in the shading color.

## Palette
| token | hex | name |
|---|---|---|
| --bg | #1B1A1E | near-black |
| --bg-alt | #28263A | dark indigo |
| --ink | #2B2235 | dark plum |
| --violet-deep | #4E3F6E | deep violet |
| --outline-sm | #5B45A8 | indigo violet |
| --outline | #6E48C8 | bright violet |
| --violet-muted | #6F5A92 | muted grape |
| --lavender | #9A80C2 | lavender |
| --lavender-light | #B9A6F2 | light lavender |
| --pink-shade | #D58AE6 | orchid |
| --magenta | #E05FC6 | hot magenta |
| --pink | #F2A8F0 | lilac pink |
| --blush | #F9CDEB | pale blush |
| --text | #F3F0F8 | soft white |

## Where each color goes
**Backgrounds:** page --bg · alternate sections, footer, loading/start screen --bg-alt ·
light cards / window faces --blush · card title bars --pink

**Text:** body on dark --text · secondary/dates/captions on dark --lavender · text on light
cards --ink · hero headline fill --pink, inner shading --pink-shade, outline --outline ·
section titles/nav fill --lavender-light, outline --outline-sm · status/pixel UI --text

**Interactive:** links --magenta, hover --pink · primary button face --magenta, text --ink,
extruded edge --violet-deep · secondary button --lavender-light face, --ink text ·
focus ring --pink 3px solid · active nav --magenta underline/marker

**Shapes & depth:** card/panel extruded sides --violet-deep · deepest shadows, icon lines --ink ·
borders on dark --violet-deep · edge highlights/glows --magenta · grain --ink on light areas,
--violet-deep on dark areas

**Decoration:** sparkles, blinking cursor --text · notification dots, "!!!" --magenta · illustration lit faces --blush and --pink ·
illustration shadows --violet-deep → --ink

## Rules
- Never put --violet-muted or --violet-deep text on dark backgrounds (too low contrast).
  They are for decoration only.
- Body text is always --text on dark or --ink on light.
- Use --magenta sparingly as the "energy" accent.
