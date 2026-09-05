# Finish One Pantry

Track finished pantry packages and add replacements to a local shopping list.
It is for households that buy the same milk, rice, or detergent again.

Try the [sample pantry](https://finish-one-pantry.sociobot.in/demo/) before
adding your own packages. The sample is separate from normal pantry data.

## What it does

- Adds a package to the shopping list when a finish reaches its chosen point.
- Records packages bought and clears that package from the shopping list.
- Lets you correct a missed count and undo a finish event.
- Keeps changes in the current browser after a reload.
- Works offline after the first visit.
- Exports a JSON backup and checks a backup before replacement.
- Provides a standalone web app manifest for installation.
- Keeps pantry data in the current browser without sending it to another origin.

Every public product claim above is registered with a demo-based browser test in
[.factory/claims.json](.factory/claims.json).

## Demo and privacy

The demo at /demo/ starts with Oat milk, Basmati rice, Laundry detergent, and
Coffee beans. It uses IndexedDB database demo:finish-one-pantry; normal data
uses finish-one-pantry. **Reset demo** restores the sample. **Start for real**
clears only the demo database and returns to the normal pantry.

See [the demo notes](.factory/demo.md) and the live
[privacy policy](https://finish-one-pantry.sociobot.in/privacy/).

## Develop and verify

Requires Node.js 20 or newer.

    npm ci
    npm test
    npm run build

npm test runs unit tests, creates a production build, and runs the desktop and
mobile Playwright suite. Run one declared claim from a clean setup with:

    npm run test:claim -- @claim:offline-reload

Run every command in .factory/claims.json before a release. Static output is
written to dist/, with dist/index.html at its root.

## Deploy

Serve dist/ as a static site. Keep sw.js revalidating and hashed files under
assets/ immutable. The factory owns deployment, DNS, and billing.

The visual system and image provenance are in
[.factory/design.md](.factory/design.md). Verification results and known gaps
are in [.factory/handoff.md](.factory/handoff.md).

## License

MIT — see [LICENSE](LICENSE).
