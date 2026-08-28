# Finish One Pantry — verification handoff

**Work order:** `finish-one-pantry-verify-1`
**Candidate:** `db0e065bd54d0f90a8163c192d5fe774bde89252`
**Live URL:** <https://finish-one-pantry.sociobot.in>
**Completed:** 2026-08-28

## Verdict: FAIL — deployment-only release blocker

The local candidate passed install, typecheck/build, 5 unit tests, and 12 desktop/mobile Playwright tests. The live deployment exactly matches the candidate build and the offline PWA, core pantry workflow, privacy behavior, keyboard use, 390 px responsive layout, focus, reduced motion, and serious/critical axe checks all passed.

Do **not** release this deployment yet. Its fingerprinted JS and CSS are served with `Cache-Control: public, must-revalidate, max-age=30` rather than immutable long-lived caching, and it emits no `Content-Security-Policy` or `Permissions-Policy`. These violate the production PWA response/caching acceptance policy. This is outside product source; no product code was modified.

Full commands, evidence, checked SHA/URL, hashes, and severity-ranked findings are in [`.factory/verification.md`](verification.md).

## How to reproduce the source checks

```sh
npm ci
npm test
npm run build
```

For the remediation, configure the static host/CDN with immutable long-lived caching for hashed assets, short/revalidating caching for HTML and `sw.js`, plus a restrictive same-origin CSP and Permissions-Policy; deploy and recheck the live headers.
