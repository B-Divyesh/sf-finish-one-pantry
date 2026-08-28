# Finish One Pantry — repair handoff

**Work order:** `finish-one-pantry-repair-1`
**Repair commit:** `81dff53ee9c0290e83bba0fe4df0de0f631f8e2a` (plus the committed verification-harness update below)
**Repaired deployment:** <https://finish-one-pantry.sociobot.in>
**Completed:** 2026-08-28

## Result

The two release-blocking deployment-policy findings in the independent report have been repaired and verified on the live static deployment. The product remains a local-first, offline Vite PWA; no application behavior, data model, or researched scope changed.

`public/staticwebapp.config.json` is copied into `dist/` and consumed by Azure Static Web Apps. It now supplies:

- `Cache-Control: public, max-age=31536000, immutable` for fingerprinted `/assets/*` files.
- `Cache-Control: public, max-age=0, must-revalidate` for documents by default and `sw.js` explicitly.
- A same-origin CSP with no object sources, constrained worker/manifest/connect sources, and `frame-ancestors 'none'`. `style-src 'unsafe-inline'` is intentionally retained only because the standalone offline fallback has an inline stylesheet.
- Explicit `Permissions-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and referrer policy.
- `application/manifest+json` for `.webmanifest`.

`tests/unit/deployment-policy.test.ts` locks the exact cache, CSP, Permissions-Policy, framing, service-worker, and manifest contracts. `playwright.config.ts` now accepts `E2E_BASE_URL`, allowing the identical desktop/mobile suite to run against the deployed product as well as the local preview.

## Verification evidence

### Clean local checks

```sh
npm ci
npm test
npm run build
```

- `npm ci`: 110 packages installed; `npm audit` reported 0 vulnerabilities.
- `npm test`: PASS — 7 Vitest unit/IndexedDB/deployment-policy tests, production typecheck/build, and 12 Playwright desktop/mobile tests.
- `npm run build`: PASS — TypeScript typecheck, Vite production build, and service-worker postbuild. Output contains `dist/index.html` and `dist/staticwebapp.config.json`.
- Production payload: JS 26.63 KB raw / 9.06 KB gzip; CSS 16.85 KB raw / 4.43 KB gzip; no shipped fonts.
- The browser suite covers the end-to-end pantry workflow, undo, keyboard Enter/Space primary path, serious/critical axe checks, offline reload with a controlled service worker, and standalone privacy/terms routes in both desktop Chromium and the mobile project.

### Live checks after deploy

```sh
/opt/fleet/lib/deploy-static.sh finish-one-pantry dist
E2E_BASE_URL=https://finish-one-pantry.sociobot.in npx playwright test
/opt/fleet/lib/verify-url.sh https://finish-one-pantry.sociobot.in /tmp/finish-one-pantry-repair-evidence
```

- Deploy succeeded to Azure Static Web Apps, custom domain ready, HTTPS `200`.
- The live document, `sw.js`, and manifest use short revalidating cache control. The live fingerprinted JS and CSS use `public, max-age=31536000, immutable`.
- The live document contains the CSP, Permissions-Policy, X-Frame-Options, HSTS, nosniff, and referrer headers. The manifest returns `Content-Type: application/manifest+json`.
- Live Playwright: PASS — all 12 desktop/mobile scenarios (19.0 s), including keyboard, axe, offline, and privacy behavior.
- Live `verify-url.sh`: PASS — title, `lang=en`, one `h1`, `main`, image alt coverage, and no browser console/page errors.
- Independent 390 × 844 live Chromium smoke: no horizontal overflow; primary action measured 208.125 × 49.5 CSS px; service worker controlled the page; no console errors and no third-party requests.
- Live identity: SHA-256 matched the local `dist/` copy for `index.html`, fingerprinted JS/CSS, `sw.js`, `manifest.webmanifest`, and `offline.html`.

The Lighthouse 13.4.1 mobile CLI was attempted with Playwright Chromium. It could not produce a score because the tab crashed in this container; the exact live browser, axe, payload, and response-policy checks above completed successfully.

## How to run and deploy

```sh
npm ci
npm test
npm run build
/opt/fleet/lib/deploy-static.sh finish-one-pantry dist
E2E_BASE_URL=https://finish-one-pantry.sociobot.in npx playwright test
```

## Known gaps / next steps

There are no known product or deployment-policy gaps from the verifier report. If a Lighthouse score is required for release reporting, rerun it in an environment where Chrome does not crash under the Lighthouse DevTools connection.
