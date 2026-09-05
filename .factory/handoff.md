# Finish One Pantry — handoff

**Latest result: PASS**

**Work order:** finish-one-pantry-repair-2
**Live URL:** <https://finish-one-pantry.sociobot.in>
**Verified:** 2026-09-05

## Versions

- **Deployed implementation:** 26bb2d82a9ce1c3f0714914178444b1e646da108
  (isolated demo, claims, routes, metadata, and 404).
- **Latest test/documentation baseline:** 223d2cabf5ebd3cfb39ab2dc644aab31e6eb89c7
  (adds the demo-reset regression after deployment; it does not change the
  shipped browser artifact).
- The earlier review baseline was c515a6f. The product code changes are
  d43e5ac and 26bb2d8; later commits only add verification evidence.

## What changed

- Added /demo/ and ?demo=1 with four realistic packages in the separate
  IndexedDB database named demo:finish-one-pantry.
- Added the persistent demo label, Reset demo, and Start for real. Leaving demo
  clears only demo data and cannot write normal pantry data.
- Reworked the first screen around the job, audience, first sample action, and
  three short facts. The landing h1 is now “Track finished packages for your
  shopping list.”
- Added claims registry, demo documentation, terminology and copy audit, plus
  demo-based observable browser tests for every public promise.
- Added route-specific demo, privacy, terms, and 404 pages; canonical, Open
  Graph, Twitter, favicon, apple-touch, robots, sitemap, and social-preview
  metadata. Unknown live routes now return the designed 404 with HTTP 404.
- Added a local social image cropped from the product’s original notebook art.
  Its provenance is recorded in design.md.
- Preserved the local-first workflow, offline service worker, versioned cache,
  JSON backup checks, update prompt, memory fallback, and existing restrictive
  static response policy.

## Verification

### Clean checkout

An isolated clone at implementation SHA 26bb2d8 ran npm ci with 0
vulnerabilities, then:

    npm test
    npm run build

Results: 8 unit tests and 28 Playwright checks passed across desktop and mobile.
The final bundle is 30.03 KB JavaScript raw / 9.78 KB gzip and 19.71 KB CSS raw
/ 4.96 KB gzip.

Every one of the 10 commands declared in claims.json was then run individually
from that clean clone. All passed. Each claim test starts at /demo/ and runs in
both desktop and mobile Chromium. The later test-only commit also ran:

    npm run test:claim -- @claim:demo-sandbox

This specifically proves Reset demo restores Oat milk to two packages before
Start for real returns to unmodified real data.

### Live HTTPS

The deployed implementation passed:

    E2E_BASE_URL=https://finish-one-pantry.sociobot.in npx playwright test --workers=1

All 28 live desktop/mobile checks passed. The worker verify-url check passed
with title, language, h1, main landmark, image alt text, and no console errors.
The Playwright Axe scan reported zero serious or critical violations.

Fresh desktop and phone sessions showed the same first-screen result before
scrolling:

- **Job:** Track finished packages for your shopping list.
- **Audience:** households buying milk, rice, or detergent again.
- **First action:** Try it with sample data; it loads four common pantry
  packages.

The live demo showed its persistent label and the four named packages. In a
fresh browser, finishing sample Oat milk, resetting the demo, and then starting
for real restored the sample and left an independently added Real lentils
package unchanged.

Live routes returned 200 for /, /demo/, /privacy/, /terms/, /sitemap.xml, and
/robots.txt. /does-not-exist returned the designed page with HTTP 404. The
deployed hashed JavaScript response is immutable for one year; documents are
revalidating. CSP, Permissions-Policy, X-Frame-Options, HSTS,
X-Content-Type-Options, and Referrer-Policy are present. The manifest is served
as application/manifest+json.

## Prior finding disposition

| Finding | Status |
| --- | --- |
| R1: no isolated sample demo | Resolved with demo:finish-one-pantry, reset, and start-for-real verification. |
| R2: no claims registry or tagged tests | Resolved with 10 declared claims and 10 outcome-based demo tests. |
| R3: first-screen and plain-words gaps | Resolved; copy audit records the landing wording and terminology. |
| R4: demo, 404, sitemap, canonical, and social metadata gaps | Resolved and checked live. |
| R5: stale PASS handoff | Resolved by this current, versioned handoff. |
| Earlier cache, CSP, and manifest MIME findings | Still resolved on the live deployment. |

## Known gaps

No product defects are known.

Lighthouse 13.4.1 could not connect to the worker-provided Chromium when run
locally, so this handoff does not claim a new Lighthouse score. The build
budget, live browser checks, mobile checks, verify-url result, and Axe scan all
completed successfully. This is a runner limitation, not a product failure.

Backend tenant, persistence-restart, health, and rate-limit checks are not
applicable: this is a static local-first PWA with no backend.

## Run and deploy

Requires Node.js 20 or newer.

    npm ci
    npm test
    npm run build

Run each command listed in .factory/claims.json from a clean checkout. Static
output is dist/. Deploy with the factory static deployer; it reuses the existing
sf-finish-one-pantry Static Web App and does not alter other products.
