# Finish One Pantry

Finish One Pantry is a free, offline-first replacement list for households that buy the same packages repeatedly. Instead of maintaining exact inventory, you pin a few repeat items and tap **Finish one** when a package empties. The app lowers an explicitly approximate reserve count and adds the item to a local shopping list at the threshold you chose.

It is for people who want fewer surprise stockouts without barcodes, receipts, expiry tracking, recipes, accounts, or pantry accounting.

## What it does

- Pins repeat packages with a rough count and per-item reorder line.
- Turns a finish event into one shopping-list entry at that line.
- Reconciles the count when a purchase comes home.
- Provides one-tap count corrections and an eight-second undo for finish events.
- Saves shelf, list, and event history in IndexedDB.
- Works after a refresh, browser restart, or offline reload.
- Exports and validates portable JSON backups.
- Includes installable PWA metadata, update prompts, standalone privacy/terms pages, and a memory-only fallback when local storage is blocked.

## Develop and verify

Requires Node.js 20 or newer.

```sh
npm install
npm run dev
npm test
npm run build
npm run preview
```

`npm test` runs unit/storage tests, creates a production build, then runs the complete workflow, keyboard, accessibility, persistence, legal-route, and offline tests in mobile and desktop Chromium. Playwright 1.58.2 is pinned. The exact production command is `npm run build`; static output lands in `dist/` with `dist/index.html` at its root.

## Data and privacy

There is no account, analytics, tracking, third-party runtime script, remote font, API, or cloud sync. Pantry records remain in the current browser unless the user explicitly downloads a JSON backup. See [`/privacy`](https://finish-one-pantry.sociobot.in/privacy/) for the user-facing policy.

## Deploy

Serve `dist/` as a static site with directory indexes enabled. Do not cache `sw.js` permanently; hashed files under `assets/` may be cached as immutable. The factory owns deployment, DNS, and billing.

The visual system and generated-image provenance are in [`.factory/design.md`](.factory/design.md). Build verification and known limitations are in [`.factory/handoff.md`](.factory/handoff.md).

## License

MIT — see [LICENSE](LICENSE).
