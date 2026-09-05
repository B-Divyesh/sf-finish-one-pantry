# Track finished pantry packages — verification 3

## Verdict: PASS

**Finding count:** 0  
**Untested public-claim count:** 0  
**Verified:** 2026-09-05  
**Live URL:** <https://finish-one-pantry.sociobot.in>  
**Implementation candidate:** `26bb2d82a9ce1c3f0714914178444b1e646da108`  
**Documentation/test baseline:** `04f1d6a67ad8598eb4e734824746424e4db98a3b`

The live output matches the reviewed implementation. The commits after
`26bb2d8` change only `tests/e2e/pantry.spec.ts` and `.factory/handoff.md`;
they do not change the shipped browser artifact. A clean build at the current
documentation/test baseline matched the live home document and app bundle,
then also matched the live demo, privacy, terms, service worker, manifest,
offline page, 404 page, and sitemap byte-for-byte.

## First screen

Fresh 1440 × 980 desktop and 390 × 844 phone browser contexts both opened at
scroll position zero with no console or page errors.

- **Job:** Track finished packages for your shopping list.
- **Audience:** households buying milk, rice, or detergent again.
- **First action:** Try it with sample data. It loads four common pantry
  packages.

The phone view had no horizontal overflow (390 px viewport and 390 px document
width). The first screen also states no account is needed, data stays in this
browser, and offline use starts after the first visit.

## Clean-checkout verification

An isolated clone at `04f1d6a` ran `npm ci` successfully with 0 reported
dependency vulnerabilities. The documented prerequisites are sufficient.

| Check | Result |
| --- | --- |
| `npm test` | PASS — 8 unit tests; production build; 28 Playwright checks across desktop and mobile. |
| `npm run build` | PASS — typecheck, Vite build, service-worker postbuild, and `dist/index.html`. |
| Production payload | PASS — JavaScript 30,034 bytes raw / 9,796 bytes gzip; CSS 19,711 bytes raw / 4,979 bytes gzip. |
| `E2E_BASE_URL=https://finish-one-pantry.sociobot.in npx playwright test --workers=1` | PASS — 28/28 live checks. |

## Claims

Each command declared in `.factory/claims.json` was run separately from the
clean clone. Every claim has exactly one `@claim:<id>` test definition and each
passed on both desktop and mobile Chromium.

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

The public landing, README, privacy, and help copy was cross-checked against
the registry. The first-screen “No account needed” statement is covered by the
`demo-sandbox` test, while browser-only storage and no cross-origin pantry-data
requests are covered by `local-private`. No unlisted testable public claim was
found.

## Independent live checks

- Entered `/demo/` from a fresh phone context. The persistent banner said
  “Demo — sample data, nothing is saved,” and the populated shelf contained
  Oat milk, Basmati rice, Laundry detergent, and Coffee beans. Finishing Oat
  milk changed its count; **Reset demo** restored it to two; **Start for real**
  returned to the separately created real “Verifier chickpeas” record. No
  browser/page error occurred.
- Verified normal, invalid, boundary, and recovery paths in the clean and live
  suites: add, finish-at-threshold, purchase reconciliation, undo, correction,
  invalid count `100`, recovery to a valid count, malformed-backup rejection,
  and continued use after rejected input.
- The live offline-reload claim uses its own browser context, waits for service
  worker control, sets the context offline, reloads `/demo/`, and verifies the
  sample and offline notice. It passed on both device profiles. The update
  control is also covered by the live suite.
- `/opt/fleet/lib/verify-url.sh` passed for the live home page: HTTPS 200,
  title, `lang=en`, one h1, main landmark, image alt coverage, labelled
  buttons, and no console/page errors. Its measured load was 674 ms in this
  worker.
- Fresh desktop and phone Axe Playwright scans found zero serious or critical
  violations. Keyboard focus on **Finish one Oat milk** was a visible
  4 px oxide outline on both. Under reduced motion, the finish feedback had no
  transition or animation duration.
- All discovered same-origin page links (`/`, `/demo/`, `/privacy/`, `/terms/`,
  `/?view=list`, and skip links) returned 200. `/does-not-exist` returned the
  designed page with HTTP 404; this is expected, not a defect.
- `/`, `/demo/`, `/privacy/`, `/terms/`, `/sitemap.xml`, and `/robots.txt`
  returned 200. Route titles, canonical URLs, description, Open Graph/Twitter
  metadata, social image, manifest, robots, and sitemap are present.
- Live headers include CSP, Permissions-Policy, X-Frame-Options, HSTS,
  X-Content-Type-Options, and Referrer-Policy. Documents, manifest, and
  service worker revalidate; the hashed app asset is immutable for one year.
  The manifest MIME type is `application/manifest+json`.

## Earlier findings

| Earlier finding | Current disposition |
| --- | --- |
| Verification 1: short-lived hashed cache headers | Resolved; live hashed JS is `max-age=31536000, immutable`. |
| Verification 1: missing CSP, Permissions-Policy, and frame protection | Resolved; all are live response headers. |
| Verification 1: generic manifest MIME type | Resolved; live MIME is `application/manifest+json`. |
| Review 1 R1: no isolated sample demo | Resolved and independently exercised with reset and real-data isolation. |
| Review 1 R2: no claim registry/tests | Resolved; 10 declared claims, 10 exact tags, and all commands passed. |
| Review 1 R3: plain-words first screen/copy audit gaps | Resolved; job, audience, first action, and facts are present on both views. |
| Review 1 R4: routes, 404, sitemap, canonical, social gaps | Resolved and verified live. |
| Review 1 R5: stale PASS handoff | Resolved by this dated, versioned report and handoff. |

## Scope notes

This is a static, local-first PWA. Backend tenant isolation, persistence
restart, health, and 429/Retry-After checks do not apply.

Lighthouse could not connect to the worker Chromium in this verification, so
no new Lighthouse score is claimed. This does not leave a public claim
untested: build budget, live browser behavior, accessibility, offline, and
response-policy checks above all completed.

