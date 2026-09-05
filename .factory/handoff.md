# Finish One Pantry — handoff

**Latest result: PASS**

**Work order:** `finish-one-pantry-repair-3`
**Verified:** 2026-09-05
**Live URL:** <https://finish-one-pantry.sociobot.in>

## Versions

- **Browser implementation:** `26bb2d82a9ce1c3f0714914178444b1e646da108`.
  This remains the latest commit that changes the shipped browser artifact.
- **Quality-gate repair and deployment source:**
  `fdaf65d` (`test: wait for pantry save before reload`).
- The deployed HTML, JavaScript, service worker, manifest, offline page, 404
  page, and sitemap match the local production build byte for byte.

## What was repaired

Review 2 found one intermittent failure in `@claim:local-save`. The test
clicked **Finish one** and reloaded before the asynchronous IndexedDB click
handler had necessarily committed. A Playwright click waits for dispatch, not
for an async event listener to finish.

The claim now waits for the changed pantry count, which the app renders only
after both IndexedDB writes complete. It then reloads and verifies both the
saved count and the resulting shopping-list entry. These checks exercise user
outcomes instead of inspecting implementation text.

No production behavior changed. The existing app already renders the updated
count only after persistence succeeds.

## Clean verification

The documented clean setup was used:

```sh
npm ci
npm test
npm run build
```

- `npm ci`: 110 packages installed, 0 reported vulnerabilities.
- Focused regression: 20/20 consecutive desktop `@claim:local-save` runs
  passed with two workers.
- `npm test`: passed three consecutive times. Each run completed 8 unit tests,
  a production typecheck/build, and 28 Playwright checks across phone and
  desktop Chromium.
- Every command in `.factory/claims.json` passed separately. All 10 claim IDs
  occur exactly once, and each ran on both browser projects.
- `npm run build`: produced `dist/index.html`. JavaScript is 30,034 bytes raw
  (9,778 bytes gzip); CSS is 19,711 bytes raw (4,960 bytes gzip).
- Lighthouse 13.4.1 on the deployed home page: Performance 100,
  Accessibility 100, Best Practices 100, SEO 100; LCP 1.2 s, CLS 0, TBT 30 ms.
- The Playwright Axe integration reported no serious or critical violations.
  `/opt/fleet/lib/verify-url.sh` passed with one h1, `lang=en`, a main
  landmark, complete image alt text, labelled buttons, and no console errors.

## Fresh browser checks

Fresh 393 × 727 phone and 1440 × 980 desktop contexts opened the live home
page at scroll position zero with no console or page errors.

- **Job:** Track finished packages for your shopping list.
- **Audience:** households that buy milk, rice, or detergent again.
- **First action:** Try it with sample data. The adjacent text says it loads
  four common pantry packages.

The live demo showed Oat milk, Basmati rice, Laundry detergent, and Coffee
beans, plus the persistent **Demo — sample data, nothing is saved** banner.
Finishing Oat milk changed its saved count and list state. **Reset demo**
restored the sample. **Start for real** removed the sample and returned to the
separate normal pantry. The full live isolation test also created a normal
package before entering the demo and confirmed it was unchanged afterward on
both phone and desktop.

The 28/28 live suite also covered purchase reconciliation, corrections, undo,
invalid and boundary input recovery, malformed backup recovery, export,
keyboard use, storage fallback, offline reload, update action, route titles,
legal pages, and the designed 404. The offline test used its own browser
context. Separate fresh-browser measurements confirmed that reduced-motion
transitions fall to an effectively instant `0.00001s`.

A separate live recovery check exported the sample, changed Oat milk, imported
the valid backup after its replacement confirmation, and observed the original
count return. It also deleted Coffee beans, confirmed the deletion after a
reload, and used **Reset demo** to restore the sample. No console error occurred.

## Deployment and response checks

The existing `sf-finish-one-pantry` Static Web App was deployed successfully
from `dist/` in production (deployment ID
`0eb28abb-93ec-4861-9dbf-6dcad353db3d`). The custom HTTPS origin returned 200
immediately after deployment.

- `/`, `/demo/`, `/privacy/`, `/terms/`, `/sitemap.xml`, and `/robots.txt`
  return 200. `/does-not-exist` intentionally returns the designed HTTP 404.
- The home document revalidates. The hashed JavaScript asset uses
  `max-age=31536000, immutable`.
- CSP, Permissions-Policy, HSTS, frame denial, MIME sniff protection, and the
  referrer policy are present.
- The manifest uses `application/manifest+json`.
- The live 28-check suite passed with one worker after deployment.

## Earlier findings

| Finding | Current disposition |
| --- | --- |
| Review 2: intermittent clean `npm test` / `local-save` failure | Resolved by waiting for the committed visible outcome; 20 focused runs and three complete gates passed. |
| Review 1: no isolated sample demo | Resolved; demo namespace, label, reset, start-for-real, and real-data isolation pass live. |
| Review 1: missing claims registry and claim tests | Resolved; 10 registered claims, 10 unique tags, and every command passes. |
| Review 1: unclear first screen and headings | Resolved; job, audience, sample-first action, facts, and copy audit are present. |
| Review 1: missing route metadata, sitemap, and designed 404 | Resolved and verified live. |
| Verification 1: short-lived hashed caching | Resolved; live hashed assets are immutable for one year. |
| Verification 1: missing CSP, Permissions-Policy, and frame protection | Resolved; all policies are present on live responses. |
| Verification 1: wrong manifest MIME type | Resolved; live MIME is `application/manifest+json`. |
| Earlier stale PASS handoff | Replaced by this repair-specific handoff. |

## Remaining work

No known product or release-gate defects remain. This is a static, local-first,
free PWA, so backend tenancy, server restart persistence, health, rate-limit,
and billing-registration checks do not apply.
