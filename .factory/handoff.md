# Finish One Pantry — handoff

**Latest result: FAIL**

**Work order:** finish-one-pantry-review-2
**Live URL:** <https://finish-one-pantry.sociobot.in>
**Reviewed:** 2026-09-05

## Versions

- **Implementation reviewed:** `26bb2d82a9ce1c3f0714914178444b1e646da108`.
- **Documentation/test baseline:** `35af7f6e0c0b54ecb89d0d06888f146336132fb1`.
  The later commits are report/test changes only; fresh build and live artifact
  hashes match.

## What was reviewed

The product is a local-first pantry replacement signal. Users finish a repeat
package, add it to a shopping list at a chosen point, then mark it bought and
record what came home. It includes corrections, undo, local browser storage,
JSON backup/import validation, offline reload, an installable manifest, and an
update action.

`/demo/` and `?demo=1` use the separate `demo:finish-one-pantry` IndexedDB
namespace with Oat milk, Basmati rice, Laundry detergent, and Coffee beans.
The demo banner, reset action, and start-for-real action were checked on fresh
phone and desktop contexts and did not change normal data.

## Verification

From a clean clone:

```sh
npm ci
npm test
npm run build
```

`npm ci` reported 0 vulnerabilities. The first clean `npm test` failed one
desktop `@claim:local-save` case after reload; the immediate retry passed all 8
unit tests and 28 Playwright checks, and `npm run build` produced `dist/`.
Every one of the 10 individual commands in `.factory/claims.json` passed, as
did 28/28 live checks:

```sh
E2E_BASE_URL=https://finish-one-pantry.sociobot.in npx playwright test --workers=1
```

Fresh phone and desktop checks confirmed the job, audience, sample-first
action, realistic demo, reset/isolation, normal and recovery flows, offline,
privacy, accessibility, legal pages, links, and designed HTTP 404. Axe
Playwright found no serious/critical violations; `verify-url.sh` passed.
The `@axe-core/cli` binary could not launch because this worker lacks
`/usr/bin/chromedriver`, so no CLI result is claimed.

## Known gap and next step

The result is FAIL because the mandatory full `npm test` gate is flaky. The
first clean run failed its desktop persistence-claim assertion; the retry,
individual command, repeated focused runs, and live suite passed. This review
does not claim demonstrated data loss, but the documented release gate must be
made deterministic. Repair the synchronization/race, then show repeated clean
`npm test` passes before declaring PASS.

Earlier demo, claims, plain-language, route/metadata/404, cache, CSP,
Permissions-Policy, and manifest-MIME findings are resolved. Backend health,
tenant, persistence-restart, and 429 checks are not applicable to this static
local-first PWA.

## Run and deploy

Requires Node.js 20 or newer. Run the commands above. Deploy `dist/` with the
factory static deployer. The factory owns deployment, DNS, and billing.
