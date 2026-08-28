# Finish One Pantry — independent verification 2

**Work order:** `finish-one-pantry-verify-2`

**Verified:** 2026-08-28

**Candidate:** `a023fffab6e016949cfa5634a0472bfc231d228f`

**Live URL:** <https://finish-one-pantry.sociobot.in>

## Verdict: PASS

The requested candidate is buildable, functions end to end as the deliberately approximate local pantry signal described in the brief, and the deployed PWA is byte-identical to the candidate production build for its entry document and sampled core artifacts. No release-blocking functional, accessibility, privacy, PWA, response-policy, or deployment-identity defect was found.

## Clean-checkout quality gates

The repository began clean at the requested detached-equivalent `main` SHA. `npm ci` installed 110 packages and reported **0 vulnerabilities**.

| Command / check | Result |
| --- | --- |
| `npm test` | **PASS** — 7 Vitest unit/IndexedDB/deployment-policy tests; production typecheck/build; 12 Playwright desktop/mobile tests, all passed in 38.3 s. |
| `npm run build` | **PASS** — `tsc --noEmit`, Vite production build, and service-worker postbuild. `dist/index.html` and `dist/staticwebapp.config.json` are produced. |
| Repository checks | There is no separate lint script. The exact build typechecks with TypeScript; `git diff --check` passed. |
| Static payload | **PASS** — JS 26.63 KB raw / 9.06 KB gzip; CSS 16.85 KB raw / 4.43 KB gzip; no shipped webfont. Both are within the static-PWA budgets. |
| Lighthouse 13.4.1, local production preview, mobile | **PASS** — Performance 93, Accessibility 100, Best Practices 100, SEO 100; LCP 1.8 s and CLS 0. Lighthouse reported 320 ms TBT, which is a lab diagnostic and not a field INP measurement. |

## Product and recovery checks

Independent browser probes supplemented the repository suite.

- Normal job: added a repeat package, finished it at its threshold, observed one shopping-list entry, marked it bought, entered a purchase quantity, and confirmed the rough reserve persisted after reload. The live suite ran this same flow on desktop and mobile.
- Boundary and recovery: reserve `100` was blocked by native validation (`Value must be less than or equal to 99.`); recovery to `99` saved, and one finish changed it to `98`. Purchase quantity `0` is likewise blocked by its `min=1` constraint.
- Export/import: a downloaded backup contained `{ product: "finish-one-pantry", version: 1 }` and the expected item. Malformed JSON produced a visible error without changing the existing shelf. A valid checked import showed the explicit replacement confirmation and replaced the notebook only after confirmation.
- The full suite covers undo, one-tap corrections/zero protection, keyboard Enter/Space for the primary path, persistence, legal routes, and offline reload.
- At exactly 390 × 844 CSS px, there was no horizontal overflow (`390/390`); the primary action was 208.125 × 49.5 px. The focused control had a designed `4px solid` outline. Reduced-motion dialog animation computed to `1e-05s`.

## Accessibility, privacy, and PWA

- **PASS:** `<title>`, `lang="en"`, one `<h1>`, one `<main>`, skip link, semantic controls, labels, focus states, image alt text, and standalone `/privacy/` and `/terms/` pages.
- **PASS:** independent axe scan at 390 px found **0 serious or critical** findings. The local and live suites also passed the core-screen axe checks on desktop and mobile.
- **PASS:** no browser console errors or page errors in local or live Chromium checks.
- **PASS:** captured live browser traffic used only `https://finish-one-pantry.sociobot.in` (document, hashed JS/CSS, and same-origin image). Static scan found no analytics, trackers, third-party runtime code, remote font, API, or cloud sync. Data is IndexedDB-local with explicit JSON export/import.
- **PASS:** a controlled versioned-service-worker probe registered v1, served a synthetic v2 from the same static build, displayed **“A fresh notebook version is ready.”**, and reloaded after **“Update now”**. A normal controlled local PWA reload while fully offline retained the stored shelf and showed the offline status.
- **PASS:** live Chromium had a controlling service worker and parsed the manifest as `application/manifest+json` without errors.

## Live deployment and response evidence

The live entry document SHA-256 is `091ccd68427cf44b1f690bc388d03fc99ab0471caf3a446570b1e6af025ffe29`, equal to local `dist/index.html`. SHA-256 also matched between local build and live deployment for:

- `assets/main-B23DatRm.js`
- `assets/main-CqrFT1Wh.css`
- `sw.js`
- `manifest.webmanifest`
- `offline.html`

`E2E_BASE_URL=https://finish-one-pantry.sociobot.in npx playwright test --workers=1 --reporter=json` exited 0: 12 expected, 12 passed, 0 unexpected, 0 flaky (30.3 s).

Live header checks confirmed HTTPS; `Cache-Control: public, max-age=31536000, immutable` on hashed `/assets/*`; revalidating `Cache-Control: public, max-age=0, must-revalidate` on the document, manifest, and `sw.js`; `Content-Security-Policy`; `Permissions-Policy`; `X-Frame-Options: DENY`; `X-Content-Type-Options: nosniff`; `Referrer-Policy: strict-origin-when-cross-origin`; and HSTS. The manifest response has the correct `application/manifest+json` MIME type.

## Defects

None identified. No source files were modified during verification; this report and the factory handoff are the only repository changes.

## Reproduce

```sh
npm ci
npm test
npm run build
E2E_BASE_URL=https://finish-one-pantry.sociobot.in npx playwright test
```
