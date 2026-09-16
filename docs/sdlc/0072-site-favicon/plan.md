# Plan 0072 — The site's own favicon

Implements [spec.md](./spec.md), from [intent.md](./intent.md).

Produced by `--auto` alongside the spec, so the spec was not read before this was built on it.

## Files

| File                              | Change                                                |
| --------------------------------- | ----------------------------------------------------- |
| `site/public/favicon-32.png`      | new — 575 B, from the source named in the spec        |
| `site/public/favicon-192.png`     | new — 1946 B                                          |
| `site/public/apple-touch-icon.png` | new — 1814 B                                          |
| `site/public/favicon.svg`         | **deleted** — Astro's                                 |
| `site/public/favicon.ico`         | **deleted** — Astro's                                 |
| `site/src/layouts/Base.astro`     | three `<link>` tags through `BASE_URL`, plus D4's note |

Nothing else. No workflow, no hook, no script, no dependency — so the derived diagram and the
repository tree are both untouched, and `docs/**` is the only other thing in the pull request.

## Order of work

1. Place the three PNGs. **Already done** — they were fetched before the spec was written, so
   that the spec could describe what exists rather than what was hoped for. That is also how
   the SVG assumption in the intent was caught.
2. Rewrite the `<link>` tags in `Base.astro` and add the provenance comment.
3. Delete `favicon.svg` and `favicon.ico` **in the same commit** as step 2. Separating them
   leaves a commit where the markup points at a file that is gone.
4. `npm run verify` at the production base, then at a preview base. The link crawl is the real
   test here: a favicon path that does not resolve is a 404 it will find.
5. Confirm the built HTML carries `/sdlc/favicon-32.png` and not `/favicon-32.png`.

## Risks, and what this plan does about them

| Risk                                                                                    | What the plan does                                                                                                                                          |
| --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A favicon `<link>` 404s at the real base path.** The first entry in the mistakes list. | Step 4 runs the crawl at both bases. This is exactly the failure that check was added for, and it has caught it before.                                     |
| **Deleting an asset something still references.**                                       | Step 3 pairs the deletion with the markup change. `grep` confirms `Base.astro` is the only reference under `site/`.                                          |
| **The mark is illegible at 16px.**                                                       | Cannot be tested locally in any way that means anything — it needs a real tab. Named in the spec, checked by looking after deploy. One glance, not a process. |
| **Browser cache still shows Astro's mark.**                                              | Expected. Flagged so a cached icon is not mistaken for a failed deploy.                                                                                     |

## How completion is proven

- `npm run verify` green at `/sdlc/` and at a preview base.
- Built HTML references `${base}favicon-32.png`; no absolute path anywhere.
- `site/public/` contains no `favicon.svg` and no `favicon.ico`.
- After deploy: the tab shows the mark, at a glance.

## Cost

One cycle, no tokens beyond it. 4.3 kB of committed assets. The `page_weight` band measures
the HTML document rather than its subresources, so it does not move.
