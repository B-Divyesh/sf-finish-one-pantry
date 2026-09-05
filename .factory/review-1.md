# Track repeat pantry packages — review 1

## Verdict: FAIL

**Finding count:** 5

**Untested public-claim count:** 11

**Reviewed live URL:** <https://finish-one-pantry.sociobot.in>

**Reviewed implementation candidate:** `a023fffab6e016949cfa5634a0472bfc231d228f`

**Documentation baseline:** `cfebcc03842a1023795084ace9cb27c47c7d2ed7`
**Review date:** 2026-09-05

The live application is the same product output as the reviewed candidate. The following local/live SHA-256 pairs matched: `index.html` `091ccd68427cf44b1f690bc388d03fc99ab0471caf3a446570b1e6af025ffe29`, `assets/main-B23DatRm.js` `ea389885d7423f7f5214905c57853e4991b011c0528ff31463631aa2c4b84d42`, `assets/main-CqrFT1Wh.css` `567b575342ea9fb6d019d013853220de8fb25dda066eee5f797398f56f3ddb41`, `sw.js`, `manifest.webmanifest`, and `offline.html`. The commit after the candidate is documentation-only, so it did not require a different product image.

## First screen before scrolling

I opened new desktop (1440 × 980) and phone (390 × 844) browser contexts at `/`.

- **Job shown:** track repeat packages that are finished and put replacements on a shopping list.
- **Audience shown:** people who buy milk, rice, detergent, or other packages again.
- **First action shown:** “Add your first item →”. It opens a form in the real local notebook.
- **Result:** this is understandable, but it is not the required one-click “Try it with sample data” action. The page has no sample label, reset control, or start-for-real control.

## Findings

| ID | Severity | Finding | Evidence and required result |
| --- | --- | --- | --- |
| R1 | High | There is no one-click demo sandbox. | The required `/demo` and `?demo=1` entry points both return the normal app. In a fresh browser I created real test item “Audit oats”, finished it, then opened `/?demo=1`; the same item, changed count, and history were present. That URL had no “Demo — sample data, nothing is saved” banner, no “Reset demo”, and no “Start for real”. This is neither an opinionated populated sample nor a separate storage namespace; it can read and alter real data. Add an isolated `demo:` store, a direct sample URL, persistent label and controls, and `.factory/demo.md`. |
| R2 | High | The required claims registry and claim tests are absent. | `.factory/claims.json` does not exist and no test is tagged `@claim:<id>`. Eleven testable public claim categories in the README and user-facing copy therefore have no declared command or sandbox evidence: free use; threshold list insertion; purchase reconciliation; corrections and eight-second undo; persistence/offline reload; JSON export and validation; installable PWA metadata; update prompt; memory fallback when storage is blocked; no tracking/third-party/cloud runtime; and local records except an explicit download. Add one registry entry and one observable demo-based test per claim, or remove the claim. |
| R3 | Medium | The first screen and several headings do not meet the plain-words landing contract. | The only `h1` is the product name, “Finish One Pantry”, instead of the job. The required sample action and three plain facts are absent. The legal headings “Your pantry stays yours.” and “A small, honest utility.”, plus UI labels such as “Back pocket” and “Tear-off shopping note”, are not headings that state the section’s purpose. `.factory/copy-audit.md` is also absent. Use job-based headings, direct labels such as “Privacy” and “Data and help”, add the required copy audit, and make the first action the sample. |
| R4 | Medium | Required route and metadata structure is incomplete. | `/demo` has the normal title and normal empty/real notebook rather than “Demo — Finish One Pantry”. An unknown URL (`/does-not-exist`) returns the normal application with HTTP 200, not a styled 404 with a way back. `sitemap.xml` returns HTTP 404. The home, privacy, and terms pages have no canonical link, Open Graph tags, or Twitter-card tags. Add the designed 404, sitemap, canonical and social metadata, and a real demo route with its own title. |
| R5 | Medium | The latest handoff reports PASS although this review finds mandatory-contract failures. | `.factory/handoff.md` at the review start reported the 2026-08-28 verification PASS and did not disclose that the product has no claims registry, demo document, or sample sandbox. It must identify this latest FAIL and the concrete remaining work, so a release reader does not rely on a stale PASS. |

## Public claims and test status

There are **11 untested public claim categories** listed in R2. Existing broad workflow tests are useful evidence but do not satisfy the claims contract: none is declared in `.factory/claims.json`, none is tagged to a claim ID, and none starts from the required demo entry point. No declared claim command exists to run.

## Checks that passed

- `npm ci` completed with 0 vulnerabilities.
- `npm test` passed: 7 Vitest tests, production build, and 12 Playwright checks.
- `npm run build` passed and created `dist/index.html`.
- `E2E_BASE_URL=https://finish-one-pantry.sociobot.in npx playwright test --workers=1` passed: 12/12 live desktop/mobile checks.
- Live normal path: add item, finish at the threshold, add once to the list, mark bought, reconcile, undo, and persistence all passed in the supplied suite. Independent invalid/boundary/recovery checks found an empty item invalid, reserve `100` rejected with “Value must be less than or equal to 99.”, and undo restored the count.
- Fresh live phone and desktop sessions had no browser console/page errors. At 390 px there was no horizontal overflow; reduced-motion toast duration was `1e-05s`; keyboard/visible focus are covered by the live suite.
- Axe Playwright scans of an empty and populated live phone screen found 0 serious/critical violations. `/opt/fleet/lib/verify-url.sh` passed after being given its required evidence-directory argument: title, `lang`, main landmark, image alt, and console checks passed. `npx @axe-core/cli` could not start its Selenium Chrome binary in this worker; this was a runner limitation, not presented as a site pass in place of the successful Playwright Axe scan.
- Privacy capture during the live workflow observed only `https://finish-one-pantry.sociobot.in`; no console/network evidence of third-party runtime traffic appeared. This behavioral observation does not replace the missing claim test.
- A fresh live service-worker session preserved “Offline beans” through a fully offline reload and showed the Offline banner. The PWA manifest parsed and immutable cache headers were present for hashed assets.
- All crawled on-page links resolved successfully. Privacy and terms routes load with their correct route titles.
- The product is static/local-first; backend-specific tenant, restart, health, and 429 checks are not applicable.

## Earlier findings and their current disposition

| Earlier report item | Current disposition |
| --- | --- |
| 2026-08-28 verification: hashed assets were short-lived rather than immutable. | Resolved. Live `assets/main-B23DatRm.js` returns `Cache-Control: public, max-age=31536000, immutable`. |
| 2026-08-28 verification: document lacked CSP and Permissions-Policy. | Resolved. Live document has the restrictive CSP, Permissions-Policy, `X-Frame-Options: DENY`, `X-Content-Type-Options`, Referrer-Policy, and HSTS. |
| 2026-08-28 verification: manifest used `application/octet-stream`. | Resolved. The live manifest is `application/manifest+json`. |
| 2026-08-28 verification 2: no defects; handoff noted Lighthouse lab TBT of 320 ms as a non-blocking limitation. | The live output still matches the previously measured candidate. A new local Lighthouse 13.4.1 attempt could not connect to the supplied Playwright Chromium, so this review does not claim a new score. This runner issue is not itself a product defect. |

## What must happen before PASS

Implement and document the isolated one-click demo, add and run the claims registry/tests, repair the first-screen and route/metadata requirements, then rerun the clean and live verification. PASS is not available until the finding count and untested public-claim count are both zero.
