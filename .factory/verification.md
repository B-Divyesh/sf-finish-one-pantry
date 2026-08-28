# Finish One Pantry — independent verification

**Work order:** `finish-one-pantry-verify-1`
**Verified on:** 2026-08-28
**Candidate:** `db0e065bd54d0f90a8163c192d5fe774bde89252`
**Live URL:** <https://finish-one-pantry.sociobot.in>

## Verdict: FAIL — deployment policy

The candidate source is buildable and the product workflow works end to end. The live deployment is byte-identical to the candidate build. It nevertheless does **not** meet the acceptance contract's production response/caching policy: fingerprinted JS and CSS are delivered with only `Cache-Control: public, must-revalidate, max-age=30`, not long-lived immutable caching, and the document response omits both `Content-Security-Policy` and `Permissions-Policy`. This is a deployment-only release blocker; no product source was changed during verification.

## Clean-checkout evidence

An isolated clone at the exact detached candidate SHA was used. `npm ci` installed 110 packages and reported **0 vulnerabilities**. The package exposes no standalone lint script; the exact build runs `tsc --noEmit`.

| Check | Result |
| --- | --- |
| `npm test` | PASS — 5 Vitest unit/IndexedDB tests plus 12 Playwright tests (desktop and mobile), 28.2 s |
| `npm run build` | PASS — typecheck, Vite production build, service-worker postbuild |
| Production payload | PASS — JS 26.63 KB raw / 9.06 KB gzip; CSS 16.85 KB raw / 4.43 KB gzip; no shipped fonts |
| Dependency audit | PASS — 0 vulnerabilities reported by `npm ci` |

The published entry document SHA-256 was `091ccd68427cf44b1f690bc388d03fc99ab0471caf3a446570b1e6af025ffe29` in both the local production build and at the live URL. Hashes also matched for `main-B23DatRm.js`, `main-CqrFT1Wh.css`, `sw.js`, `manifest.webmanifest`, `offline.html`, and sampled AVIF/WebP assets.

## Functional and recovery checks

Fresh browser checks covered the brief's smallest useful workflow:

- Added a recurring package, finished it, observed threshold list insertion, marked it bought, entered purchase quantity, and confirmed persistence across reload.
- Exercised undo, count corrections, zero-reserve protection, named delete/erase confirmations, JSON export, and valid import replacement in the repository suite.
- Independently tested bounds: reserve `100` was blocked by native validation; recovery to `99` and threshold `20` saved; `Finish one` changed `99` to `98`.
- Imported malformed JSON through the real file chooser and received a visible parse-error toast; the notebook remained usable.
- Desktop keyboard flow passed in the suite. Independent focus inspection found a visible `4px solid` focus outline.
- At 390 × 844 mobile, the primary target was 208.125 × 49.5 px, the smallest visible button dimension was 49.5 px, and there was no horizontal overflow. Reduced-motion transition duration was effectively zero (`0.00001s`).

## Accessibility, privacy, and PWA

- PASS: one `h1`, one `main`, `lang="en"`, title, skip link, labels, and standalone privacy/terms routes.
- PASS: independent axe scans at desktop and 390 px found **0 serious/critical** violations; the shipped suite found the same on empty and populated core screens.
- PASS: no page errors or console errors in local or live Chromium sessions.
- PASS: no third-party browser requests. The observed live app requests were the document and same-origin fingerprinted script only; static review found IndexedDB and same-origin service-worker fetches, not analytics, remote fonts, APIs, or tracking.
- PASS: live service worker controlled the page, cached the fingerprinted JS, and supported a full offline reload with the offline banner and functioning UI. A simulated newer worker displayed **“A fresh notebook version is ready. Update now”** and accepted the update action.
- PASS: Chrome DevTools reported no manifest errors and no installability errors, despite the live manifest's generic MIME type.

## Live response evidence

Present on the document and sampled assets: HTTPS, `Strict-Transport-Security: max-age=10886400; includeSubDomains; preload`, `Referrer-Policy: strict-origin-when-cross-origin`, and `X-Content-Type-Options: nosniff`.

### Defects

| Severity | Finding | Evidence and impact |
| --- | --- | --- |
| **High — release blocker** | Fingerprinted static assets are not immutable/long-lived cached. | Live `/assets/main-B23DatRm.js` and `/assets/main-CqrFT1Wh.css` both return `Cache-Control: public, must-revalidate, max-age=30`. This violates the PWA performance/caching acceptance policy for hashed assets and causes unnecessary revalidation on every session. |
| **High — release blocker** | Missing browser security response policies. | Live document headers contain no `Content-Security-Policy` and no `Permissions-Policy` (nor `X-Frame-Options`). The app stores household data locally; a restrictive same-origin CSP is required defense in depth against script injection. |
| Informational | Manifest is served as `application/octet-stream`. | Chromium currently parses it and reports no installability error, so this is not a functional blocker. Serve `application/manifest+json` for standards-correct delivery. |

## Tooling note

An additional clean Lighthouse 12.6.1 mobile attempt reached artifact collection but ended with a Chrome DevTools `Connection closed` / `Target closed` failure during BFCache collection, so it produced no score and is not presented as a measurement. The independent axe, mobile, bundle, error, and response checks above completed successfully. This runner limitation does not change the deployment-policy failure.

## Required remediation and re-verification

Configure the deployment/CDN to use immutable, long-lived caching for hashed `/assets/*` files while keeping HTML and `sw.js` short-lived/revalidating. Add a restrictive CSP appropriate to this static application (at minimum a self-only script/style/image/manifest/worker policy) and an explicit Permissions-Policy. Then redeploy and rerun the live header/caching checks; no application-code change is required for the defects above.
