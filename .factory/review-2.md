# Track finished pantry packages — review 2

## Verdict: FAIL

**Finding count:** 1
**Untested public-claim count:** 0
**Review date:** 2026-09-05
**Live URL:** <https://finish-one-pantry.sociobot.in>
**Implementation reviewed:** `26bb2d82a9ce1c3f0714914178444b1e646da108`
**Documentation/test baseline:** `35af7f6e0c0b54ecb89d0d06888f146336132fb1`

The live browser artifact matches a fresh build of the implementation candidate.
The commits after `26bb2d8` alter tests and reports only, not the shipped app.
This is a FAIL because the required clean-checkout `npm test` gate was flaky:
the first run failed a declared persistence-claim test, while the immediate retry
passed. That does not prove lost user data, but it does mean the release quality
gate cannot yet be relied on.

## First screen before scrolling

Fresh 390 × 844 phone and desktop browser contexts opened `/` at the top of the
page. Both showed:

- **Job:** “Track finished packages for your shopping list.”
- **Audience:** households buying milk, rice, or detergent again.
- **First action:** “Try it with sample data,” which loads four common pantry
  packages.

Both views also showed the three facts: no account is needed, data stays in the
browser, and offline use starts after the first visit. There was no horizontal
overflow or browser/page error.

## Finding

| ID | Severity | Finding | Evidence and required result |
| --- | --- | --- | --- |
| R2-1 | Medium | The required clean `npm test` quality gate is flaky. | In a fresh clone after `npm ci`, the first `npm test` ran 8 unit tests and then 28 Playwright checks; desktop `@claim:local-save` failed after finishing Oat milk and reloading because the expected “Oat milk: about 1 sealed package left” control was absent. The same fresh clone passed an immediate full retry (28/28), ten repeated desktop-only runs of that test passed, all individual claim commands passed, and the live suite passed. This is not evidence of a persistent user-data failure, but a release test that sometimes fails is not a passing quality gate. Make the test/application synchronization deterministic, then demonstrate repeated clean `npm test` passes. |

## Claims

Every command declared in `.factory/claims.json` was run from the clean clone.
Each passed on both mobile and desktop Chromium. Therefore no public claim is
untested.

| Claim ID | Result |
| --- | --- |
| `demo-sandbox` | PASS |
| `list-at-threshold` | PASS |
| `purchase-reconciliation` | PASS |
| `corrections-and-undo` | PASS |
| `local-save` | PASS when run as its declared command; see R2-1 for the full-suite failure |
| `offline-reload` | PASS |
| `json-backup` | PASS |
| `backup-validation` | PASS |
| `installable-app` | PASS |
| `local-private` | PASS |

The landing, README, privacy, terms, and help copy was compared with the
registry. No additional testable public claim was found.

## Checks that passed

- Clean `npm ci` completed with 0 reported dependency vulnerabilities.
- The clean retry of `npm test` passed: 8 unit tests and 28 Playwright checks.
  `npm run build` passed and produced `dist/index.html`.
- The JavaScript bundle is 30,034 bytes raw / 9,796 bytes gzip; CSS is 19,711
  bytes raw / 4,979 bytes gzip.
- `E2E_BASE_URL=https://finish-one-pantry.sociobot.in npx playwright test --workers=1`
  passed 28/28 on the live site.
- Fresh live phone and desktop checks created a normal test package, entered
  `/demo/`, saw the persistent “Demo — sample data, nothing is saved” label,
  finished Oat milk, reset the sample, and started for real. The normal test
  package remained and no sample package appeared in normal data.
- Normal, invalid, boundary, and recovery paths passed in the clean/live
  suites: add, threshold list insertion, bought reconciliation, correction,
  undo, invalid reserve 100, recovery to a valid count, and invalid-backup
  rejection without replacement.
- The offline reload claim uses its own context and passed. The update action,
  keyboard flow, focus state, storage-unavailable fallback, and reduced-motion
  path passed in the suite.
- `verify-url.sh https://finish-one-pantry.sociobot.in` passed: HTTPS 200,
  title, `lang`, one h1, main landmark, image alt coverage, labelled buttons,
  and no console/page errors. It measured 829 ms in this worker.
- Axe Playwright scans in the clean and live suites found zero serious or
  critical violations. `@axe-core/cli` could not start because this worker has
  no `/usr/bin/chromedriver`; that runner limitation is not substituted for the
  successful Playwright axe integration.
- Privacy claim capture saw only same-origin browser requests during the demo
  finish/export flow. There are no remote fonts, analytics, or product APIs.
- `/`, `/demo/`, `/privacy/`, `/terms/`, `/sitemap.xml`, and `/robots.txt`
  returned 200. `/does-not-exist` returned the designed HTTP 404, which is
  expected. Route titles, canonical URLs, metadata, legal pages, and links
  passed.
- The fresh local and live SHA-256 values match for the home document, app
  bundle, service worker, manifest, offline page, 404 page, and sitemap. Live
  hashed assets are one-year immutable; documents, manifest, and service
  worker revalidate. Live headers include CSP, Permissions-Policy,
  X-Frame-Options, HSTS, X-Content-Type-Options, and Referrer-Policy.

## Earlier findings and disposition

| Earlier finding | Current disposition |
| --- | --- |
| Verification 1: short-lived hashed cache headers | Resolved; live hashed JavaScript is `max-age=31536000, immutable`. |
| Verification 1: missing CSP, Permissions-Policy, and frame protection | Resolved; all are live response headers. |
| Verification 1: generic manifest MIME type | Resolved; live manifest is `application/manifest+json`. |
| Review 1 R1: no isolated sample demo | Resolved; independently exercised with persistent label, reset, and normal-data isolation. |
| Review 1 R2: no claims registry/tests | Resolved; 10 claim IDs, 10 matching tagged tests, and all declared commands passed. |
| Review 1 R3: first-screen/plain-language gaps | Resolved; job, audience, first action, facts, and copy audit are present. |
| Review 1 R4: routes, metadata, sitemap, and 404 gaps | Resolved; current live checks passed. |
| Review 1 R5: stale handoff | Replaced by the current dated handoff, which records this FAIL. |

## Scope

This is a static local-first PWA. Backend tenant isolation, restart
persistence, health, and 429/Retry-After checks do not apply.

## Required before PASS

Remove the intermittent `npm test` failure and show repeated clean runs of the
documented quality gate passing. No product-code change was made by this review.
