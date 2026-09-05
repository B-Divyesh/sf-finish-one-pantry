# Finish One Pantry — handoff

**Latest result: FAIL**

**Work order:** `finish-one-pantry-review-1`

**Implementation reviewed:** `a023fffab6e016949cfa5634a0472bfc231d228f`

**Documentation baseline reviewed:** `cfebcc03842a1023795084ace9cb27c47c7d2ed7`

**Live URL:** <https://finish-one-pantry.sociobot.in>
**Date:** 2026-09-05

No product code was changed in this work order. The live output matches the locally built implementation candidate for the entry document, hashed JS/CSS, service worker, manifest, and offline fallback.

## What was verified

- `npm ci` completed with 0 vulnerabilities.
- `npm test`, `npm run build`, and all 12 live desktop/mobile Playwright checks passed.
- The normal local-first pantry workflow, error/boundary recovery, keyboard operation, offline reload, privacy/terms routes, privacy request capture, and Axe Playwright smoke scans passed.
- Earlier deployment findings for immutable assets, security headers, and manifest MIME are resolved on live.

## What remains

The product cannot be accepted yet. The latest independent review found 5 findings and 11 untested public claim categories:

1. No isolated one-click sample/demo exists; `?demo=1` displays the real browser notebook.
2. `.factory/claims.json` and tagged claim tests are missing.
3. First-screen copy and headings do not satisfy the required plain-words landing shape; `.factory/copy-audit.md` is missing.
4. Required demo/404/sitemap/canonical/social route metadata is incomplete.
5. This handoff previously presented a stale PASS despite those mandatory-contract gaps.

See [`.factory/review-1.md`](review-1.md) for reproduction evidence, prior-finding disposition, and the required repair work.

## Run / verify

```sh
npm ci
npm test
npm run build
E2E_BASE_URL=https://finish-one-pantry.sociobot.in npx playwright test --workers=1
```

After the remaining work, verify the demo entry point, every command in the new claims registry, live routes/metadata, and the clean build before changing this handoff to PASS.
