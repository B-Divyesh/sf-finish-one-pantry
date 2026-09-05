# Finish One Pantry — handoff

**Latest result: PASS**

**Work order:** finish-one-pantry-verify-3
**Live URL:** <https://finish-one-pantry.sociobot.in>
**Verified:** 2026-09-05

## Versions

- **Reviewed implementation:** `26bb2d82a9ce1c3f0714914178444b1e646da108`.
  It adds the isolated demo, claim coverage, routes/metadata, and real 404.
- **Documentation/test baseline:** `04f1d6a67ad8598eb4e734824746424e4db98a3b`.
  The later changes are only `tests/e2e/pantry.spec.ts` and handoff/report
  documentation; they do not alter the shipped browser artifact.

## What is delivered

- A local-first pantry replacement signal: finish a recurring package, add it
  at its chosen threshold, then mark it bought and record what came home.
- Corrections, undo, persistent browser storage, JSON backup/import validation,
  offline reload after first visit, standalone manifest, and update prompt.
- `/demo/` and `?demo=1` with four realistic packages in the separate
  `demo:finish-one-pantry` IndexedDB namespace. Its banner, reset, and
  start-for-real controls never write normal pantry data.
- Plain first-screen copy, route titles/metadata, sitemap, social preview,
  designed HTTP 404, privacy/terms, restrictive response headers, and original
  notebook art with provenance in `.factory/design.md`.

## Verification

From a clean clone at the documentation/test baseline:

```sh
npm ci
npm test
npm run build
```

Results: 0 dependency vulnerabilities; 8 unit tests passed; the production
build created `dist/`; and 28 desktop/mobile Playwright tests passed. The app
bundle is 30,034 bytes raw / 9,796 bytes gzip; CSS is 19,711 bytes raw / 4,979
bytes gzip.

Every command in `.factory/claims.json` was run separately and passed. The live
run also passed all 28 checks:

```sh
E2E_BASE_URL=https://finish-one-pantry.sociobot.in npx playwright test --workers=1
```

Fresh phone and desktop sessions showed the job (“Track finished packages for
your shopping list”), audience (households buying repeat milk, rice, or
detergent), and first action (“Try it with sample data”) before scrolling. The
manual live demo check confirmed the banner, realistic sample, reset, and
real-data isolation. Axe found no serious or critical issues, `verify-url.sh`
reported no console/page errors, focus is visible, reduced motion has no
feedback animation, and a phone viewport has no horizontal overflow.

The live artifact matches the local candidate build for the entry document,
app bundle, demo/privacy/terms pages, service worker, manifest, offline page,
404 page, and sitemap. Live headers have immutable hashed assets, revalidating
documents/SW, CSP, Permissions-Policy, X-Frame-Options, HSTS,
X-Content-Type-Options, Referrer-Policy, and correct manifest MIME type.

## Earlier findings and known gaps

All earlier findings are resolved: the demo/claims/plain-language/route gaps
from review 1, and hashed-cache/CSP/Permissions-Policy/manifest-MIME gaps from
verification 1. There are no known product defects and no untested public
claims.

Lighthouse could not connect to the worker Chromium during this verification,
so this handoff makes no new Lighthouse-score claim. The completed browser,
accessibility, offline, bundle, and response checks are recorded in
`.factory/verification-3.md`.

Backend tenant, restart-persistence, health, and rate-limit checks are not
applicable because this product has no backend and stores state locally.

## Deploy

Requires Node.js 20 or newer. Deploy `dist/` with the factory static deployer.
The factory owns deployment, DNS, and billing; do not add remote services or
product secrets.
