# Finish One Pantry — visual system

## Direction and product fit

**Handwritten lab notebook.** This product is deliberately an approximate household signal, not an accounting system. It should feel like the dependable tick marks someone keeps inside a cupboard door: quick, forgiving, and visibly human. A warm graph-paper field, dark fountain-pen marks, oxide-red action stamps, and small pieces of paper tape make the state legible without pretending to be a stock-control dashboard.

This is an intentionally single-mode visual thesis. The physical-paper metaphor, verified contrast, and predictable daylight palette are more valuable here than an automatic dark theme that would turn the notebook into an unrelated glowing interface. The page background is painted explicitly in every route and install surface.

## Palette

| Token | Value | Use |
| --- | --- | --- |
| Paper | `#F4F0E4` | page background |
| Paper raised | `#FFFDF6` | slips and dialogs |
| Grid | `#D6D4C5` | graph-paper rules |
| Ink | `#162C35` | primary text and outlines |
| Ink muted | `#52636A` | supporting text |
| Oxide | `#A23C2C` | primary Finish action and urgent marks |
| Oxide dark | `#76291F` | pressed state and text-safe red |
| Brass | `#D7B45A` | tape and threshold annotations |
| Leaf | `#356A50` | success/check state |
| Warning wash | `#F3DCA2` | low-reserve callout |
| Danger wash | `#F1CEC3` | destructive confirmation |

Ink on paper is above 12:1; muted ink on paper is above 5.5:1; white on oxide is above 5.3:1. Color is always paired with a word, count, or icon.

## Typography

- **Headings and annotations:** `Segoe Print`, `Bradley Hand`, `Comic Sans MS`, cursive. This system-only handwritten stack avoids a font download and gives headings a lived-in note quality.
- **Interface and long-form:** `Avenir Next`, `Segoe UI`, `Helvetica Neue`, Arial, sans-serif. Calm, highly legible, and already present on common platforms.
- Scale: 14 / 16 / 18 / 23 / 32 / 44 px. Body is never below 16 px. Counts use tabular figures. Reading measure tops out at 68 characters.

## Spacing and shape

The base rhythm is 4 px, with primary intervals of 8, 12, 16, 24, 32, and 48 px. Mobile content is inset 16 px plus safe-area values. Controls are at least 48 px high. Paper slips use 2–4 px corner radii rather than software-like rounded cards; shelf items are grouped by proximity and separated by ruled lines. Fine borders look hand-drawn through subtly uneven authored SVG strokes, never through random runtime jitter.

## Interaction grammar

- The shelf is the home surface. Each row reads left-to-right: item, approximate reserve, one unmistakable **Finish one** stamp.
- Finishing one package immediately lowers the reserve. When it meets the item's threshold, the item is placed on the list once. A compact undo slip appears at the bottom.
- Reserve numbers are explicitly labelled **about**. `+` and `−` corrections are nearby so a missed event is recoverable without editing a history ledger.
- Add/edit uses a focused paper-sheet dialog. Delete always names the item and asks for confirmation.
- The list is a separate notebook tab. Checking an item means “bought”; the app then asks how many reserves came home and resets the signal.
- Import is validated before any local records are replaced. Export and import are under **Data & help**, away from the daily one-tap path.

## Motion policy

UI transitions are 180–240 ms. A finished package gives the reserve number one small downward stamp and brings the undo slip upward from its physical origin. Dialogs rise slightly with their paper shadow. Nothing loops. Under `prefers-reduced-motion: reduce`, translations and transforms are removed; feedback changes opacity instantly and focus/state text remains available.

## Original asset plan and provenance

- `public/images/notebook-pantry.webp` and AVIF/PNG fallbacks: original generated still life for the empty shelf/intro, showing three anonymous pantry packages, a pencil tick, torn graph paper, and red stamp mark. It explains the “finish one, remember later” gesture without claiming barcode or camera features.
- PWA icons and small UI glyphs are hand-authored SVGs based on a package outline and check mark, then rasterized locally for install sizes.
- Graph texture is pure CSS; torn edges and pencil marks are authored CSS/SVG, with no stock imagery.

### Image prompt sheet

**Subject:** overhead still life of three plain, unbranded repeat pantry packages on an open handwritten lab notebook, one emptied package tipped on its side, a short pencil, a tiny grocery checklist with one red stamped circle. **World/materials:** warm recycled paper, faint square grid, graphite, fountain-pen lines, matte cardboard, subtle paper tape. **Light/lens:** soft window daylight from upper left, gentle real shadow, straight overhead editorial lens. **Palette words:** oat paper, deep blue-black ink, muted oxide red, aged brass tape, leaf green. **Composition:** generous negative space, quiet practical scene, object edges clean enough for a small mobile crop. **Negative list:** no text, no letters, no numbers, no watermark, no logo, no brand, no people, no hands, no glossy UI, no gradients, no neon, no photoreal supermarket labels.

Generation command: `/opt/fleet/lib/gen-image.sh` using the factory Azure image deployment, 2026-08-27. Generated imagery is original to this product under the factory's output terms. The selected image and prompt sidecar live in `assets/src/`; optimized derivatives ship in `public/images/`.
