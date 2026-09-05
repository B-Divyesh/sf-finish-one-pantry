# Track finished pantry packages — review 3

## Verdict: PASS

**Finding count:** 0  
**Untested public-claim count:** 0  
**Review date:** 2026-09-05  
**Live URL:** <https://finish-one-pantry.sociobot.in>  
**Implementation reviewed:** `26bb2d82a9ce1c3f0714914178444b1e646da108`  
**Quality-gate test repair:** `fdaf65dccb7bb95d10685d98e028d1239c46f7fa`  
**Documentation baseline:** `500ff594e5d7b9aab04538fc738407fe1dc2cc75`

This review is a PASS. There are zero findings at every severity and zero
untested public claims. The browser implementation is `26bb2d8`; the later
test repair waits for the already-visible IndexedDB save before reloading, and
the later commits are reports. A fresh production build at the documentation
baseline matched live byte-for-byte for home, demo, privacy, and terms;
JavaScript, CSS, service worker, manifest, offline and 404 pages, sitemap, and
robots.

## First screen before scrolling

Fresh desktop (1440 × 980) and phone (393 × 727) contexts opened the live home
at scroll position zero. Both had no page or console errors.

- **Job:** “Track finished packages for your shopping list.”
- **Audience:** households buying milk, rice, or detergent again, so
  replacements reach a local list before they run out.
- **First action:** “Try it with sample data.” It is visible at 504 px on
  desktop and 509 px on phone and says that it loads four common packages.

Both first screens also state “No account needed,” “Data stays in this browser,”
and “Works offline after the first visit.” The phone document width was exactly
the 393 px viewport width. Visual inspection confirmed the handwritten
notebook system is legible and the primary sample action remains clear.

## Demo and product checks

- The one-click live demo showed the persistent “Demo — sample data, nothing
  is saved” label, Reset demo, Start for real, and four realistic packages:
  Oat milk, Basmati rice, Laundry detergent, and Coffee beans.
- In a fresh live context, Oat milk changed from 2 to 1 after Finish one, then
  returned to 2 after Reset demo. A real “Review 3 lentils” package survived
  entering and leaving the demo, while no sample package appeared in real
  data. `?demo=1` also opened the labelled demo with its own Demo route title.
- The full live Playwright suite passed **28/28**. It covers normal,
  invalid, boundary, and recovery paths: package creation, threshold list
  insertion, purchase reconciliation, correction, undo, invalid count
  rejection and recovery, invalid-backup preservation, blocked-storage
  fallback, keyboard use, offline reload, service-worker update action, route
  titles, designed 404, and Axe checks.
- All discovered functional links on home, demo, privacy, terms, and the 404
  page returned 200. `/does-not-exist` returned the designed page with HTTP
  404, which is intentional and correct.

## Clean checkout and claims

The documented clean setup completed with `npm ci` (110 packages, 0 reported
dependency vulnerabilities). `npm test` passed 8 unit tests, the production
build, and 28 desktop/phone Playwright tests. `npm run build` produced
`dist/index.html`. The generated JavaScript was 30,034 bytes raw / 9,796 bytes
gzip; CSS was 19,711 bytes raw / 4,979 bytes gzip.

Every declared command in `.factory/claims.json` was run from this clean state,
on both desktop and phone Chromium. Each claim tag occurs exactly once in the
suite.

| Claim ID | Result |
| --- | --- |
| `demo-sandbox` | PASS |
| `list-at-threshold` | PASS |
| `purchase-reconciliation` | PASS |
| `corrections-and-undo` | PASS |
| `local-save` | PASS |
| `offline-reload` | PASS |
| `json-backup` | PASS |
| `backup-validation` | PASS |
| `installable-app` | PASS |
| `local-private` | PASS |

Landing, demo, help, legal, README, manifest, and metadata copy was
cross-checked against the registry. No additional testable public claim was
found.

## Accessibility, privacy, PWA, and site structure

- `/opt/fleet/lib/verify-url.sh` passed against live: HTTPS 200, title,
  `lang=en`, one h1, main landmark, complete image alt text, labelled buttons,
  and no console/page errors (833 ms in this worker).
- Fresh Playwright Axe scans of live desktop and phone demo screens had zero
  serious or critical violations. The requested `npx @axe-core/cli` could not
  create its Selenium Chrome session because this worker has no Chrome binary;
  this runner limitation is not presented as an Axe CLI pass. The project’s
  Playwright Axe integration and the direct scans above completed successfully.
- On a fresh phone reduced-motion context, a focused Finish button had a
  visible `4px` oxide outline, 105 × 85 px target size, and both transition and
  animation durations of `0.00001s`.
- The dedicated offline claim passed after service-worker control in its own
  browser context. The privacy claim records only same-origin requests during
  demo finish and export; no remote font, analytics, product API, or other
  third-party request was observed.
- `/`, `/demo/`, `/privacy/`, `/terms/`, sitemap, and robots return 200 with
  correct route titles and metadata. The live document has CSP,
  Permissions-Policy, X-Frame-Options, HSTS, X-Content-Type-Options, and
  Referrer-Policy. The hashed app asset is immutable for one year; document,
  manifest, and worker revalidate; the manifest MIME type is
  `application/manifest+json`.

## Earlier findings and disposition

| Earlier finding | Current disposition |
| --- | --- |
| Verification 1: short-lived hashed cache headers | Resolved; live app JavaScript is `max-age=31536000, immutable`. |
| Verification 1: CSP, Permissions-Policy, and frame protection missing | Resolved; each is a live response header. |
| Verification 1: generic manifest MIME type | Resolved; live MIME is `application/manifest+json`. |
| Review 1 R1: no isolated one-click demo | Resolved; direct live exercise proved the label, reset, start-for-real, and normal-data isolation. |
| Review 1 R2: no claims registry or claim tests | Resolved; ten declared claims, ten exact tags, and every declared command passed. |
| Review 1 R3: first-screen and plain-language gaps | Resolved; both fresh devices show job, audience, sample-first action, and three facts. |
| Review 1 R4: route, metadata, sitemap, and 404 gaps | Resolved; live route, metadata, link, and designed-404 checks passed. |
| Review 1 R5: stale handoff | Resolved; this dated report and handoff state the current PASS. |
| Review 2: intermittent `local-save` clean-gate failure | Resolved by `fdaf65d`; clean full gate and the separate claim command passed. |

## Scope

This product is a static, local-first PWA. It has no backend tenant,
server-restart persistence, health endpoint, or 429/Retry-After behavior to
review.
