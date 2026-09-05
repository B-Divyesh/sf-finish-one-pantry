# Track finished pantry packages — verification 4

## Verdict: PASS

**Finding count:** 0
**Untested public-claim count:** 0
**Verified:** 2026-09-05
**Live URL:** <https://finish-one-pantry.sociobot.in>
**Implementation candidate:** `26bb2d82a9ce1c3f0714914178444b1e646da108`
**Quality-gate repair:** `fdaf65dccb7bb95d10685d98e028d1239c46f7fa`
**Documentation baseline:** `a5f350aecd3d16fc4741e310558c86686cbe2bf4`

The browser implementation remains `26bb2d8`; `fdaf65d` changes the
Playwright synchronization for the local-save check, and `a5f350a` records
the previous repair verification. A fresh production build at the documented
baseline exactly matched the live home, demo, privacy, and terms documents;
the JavaScript and CSS bundle; service worker; manifest; offline page; 404
page; sitemap; and robots file.

## First screen

Fresh, separate 1440 × 980 desktop and 393 × 727 phone Chromium contexts
opened the live home at scroll position zero. Neither produced a page or
console error.

- **Job:** Track finished packages for your shopping list.
- **Audience:** Households buying milk, rice, or detergent again, so
  replacements reach a local list before they run out.
- **First action:** Try it with sample data.

The action was visible without scrolling on both devices. The phone had no
horizontal overflow.

## Clean checkout and claims

An isolated clone at `a5f350a` used the documented `npm ci` setup (110
packages, 0 reported vulnerabilities). `npm test` passed: 8 unit tests, a
production typecheck/build, and 28 Playwright checks across desktop and phone
Chromium. `npm run build` produced `dist/index.html`.

Every declared command in `.factory/claims.json` was run separately from that
clone. Each command built the production app and passed on both browser
profiles.

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

There are ten claim IDs and ten matching test tags, each exactly once. The
landing page, README, help, privacy, and terms copy were checked against the
registry; no unlisted testable public claim was found.

## Live product checks

`E2E_BASE_URL=https://finish-one-pantry.sociobot.in npx playwright test
--workers=1` passed **28/28**. It covers the normal, invalid, boundary, and
recovery paths: package creation, threshold list insertion, purchase
reconciliation, correction, undo, invalid count rejection and recovery,
malformed-backup rejection, storage fallback, keyboard operation, offline
reload, update action, route titles, and the designed 404.

I also independently entered the live demo from a fresh browser containing a
normal `Independent QA lentils` package. The demo showed Oat milk, Basmati
rice, Laundry detergent, and Coffee beans with the persistent **Demo — sample
data, nothing is saved** label. Finishing Oat milk changed its count; **Reset
demo** restored the count; **Start for real** returned to the separate normal
package with no sample package present. This confirms the one-click demo,
realistic populated result, reset, and real-data isolation.

The dedicated offline claim uses its own browser context, waits for service
worker control, then reloads the demo offline. It passed on both profiles.
The privacy claim recorded only same-origin browser requests during the demo
finish/export flow.

## Accessibility, performance, and site structure

- `/opt/fleet/lib/verify-url.sh` passed against the live home: HTTPS 200,
  title, `lang=en`, one h1, a main landmark, complete image alt text, labelled
  buttons, and no page/console errors. Its measured load was 576 ms.
- The live Playwright Axe integration found no serious or critical violations.
  A fresh phone reduced-motion check produced `0.00001s` transition and
  animation durations. Keyboard focus was a visible 4 px oxide outline; the
  sampled Finish button was 105 × 85 px.
- Lighthouse 13.4.1 recorded Performance **99**, Accessibility **100**, Best
  Practices **100**, and SEO **100** (LCP 1.285 s, CLS 0, TBT 142 ms). The
  Chrome tab exited after the JSON result was written, but the recorded audit
  results are complete and all product performance thresholds pass.
- `/`, `/demo/`, `/privacy/`, `/terms/`, `/sitemap.xml`, and `/robots.txt`
  return 200 with correct titles and metadata. `/does-not-exist` deliberately
  returns the designed HTTP 404 with a way home; that is expected. All
  discovered functional links return 200. The 404 page's own `#main` skip
  link retains that intentional 404 status.
- Live responses include CSP, Permissions-Policy, X-Frame-Options,
  X-Content-Type-Options, Referrer-Policy, and HSTS. The app bundle is
  `max-age=31536000, immutable`; document, manifest, and service worker
  revalidate; the manifest is `application/manifest+json`.

## Earlier findings

| Earlier finding | Current disposition |
| --- | --- |
| Verification 1: hashed assets had short cache lifetimes | Resolved; the live hashed app asset is immutable for one year. |
| Verification 1: CSP, Permissions-Policy, and frame protection were missing | Resolved; all are present as live response headers. |
| Verification 1: manifest had a generic MIME type | Resolved; it is `application/manifest+json`. |
| Review 1 R1: no isolated one-click demo | Resolved; independently exercised with label, reset, start-for-real, and normal-data isolation. |
| Review 1 R2: claims registry/tests absent | Resolved; ten declared claims and all ten declared commands passed. |
| Review 1 R3: first-screen/plain-language gaps | Resolved; job, audience, sample-first action, facts, and copy audit are present. |
| Review 1 R4: route/metadata/sitemap/404 gaps | Resolved; route, metadata, and designed-404 checks passed live. |
| Review 1 R5: stale handoff | Resolved by the current versioned handoff and this report. |
| Review 2: intermittent `local-save` clean-gate failure | Resolved by `fdaf65d`; the full clean gate and separate local-save command passed. |

## Scope

This is a static, local-first PWA. Backend tenant isolation, service restart
persistence, health endpoint, and 429/Retry-After checks do not apply.
