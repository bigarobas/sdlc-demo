# Spec 0072 — The site's own favicon

Implements [intent.md](./intent.md).

Produced by `/sdlc --auto`, so nobody read this before the plan and the implementation were
built on it. The design space is one asset and one link tag, which is the case `--auto` is
for.

## The intent's outcome was wrong about one thing

It said `Base.astro` "already references `${base}favicon.svg`, and should not need to change".
That assumed the mark would arrive as an SVG. It does not exist as one: digitalvirgo.com
publishes PNG rasters only — 32×32, 180×180 and 192×192, and no `.ico` at the origin either.

So `Base.astro` does change. Noted here rather than quietly diverging.

## 1. Guiding decisions

| #   | Decision | Why |
| --- | --- | --- |
| D1 | **PNG, at 32 and 192**, plus a 180 `apple-touch-icon`. | Not a preference. Those are the only formats the source publishes. Converting a raster to SVG would mean tracing it — inventing a mark that looks approximately like theirs, which is worse than using theirs. |
| D2 | **Astro's `favicon.svg` and `favicon.ico` are deleted**, not left beside the new files. | Leaving them means the repository contains two favicons and a reader has to work out which one is live. It is also what the intent is about: the site stops carrying the framework's identity, rather than carrying both. |
| D3 | Both links go through `import.meta.env.BASE_URL`. | Every deploy target is a subfolder — `/sdlc/`, and now `/sdlc-preview/<id>/` too. An absolute `/favicon-32.png` 404s. This exact bug shipped here once and is the first entry in the mistakes list. |
| D4 | The asset's origin is recorded **in `Base.astro`, next to the tag.** | A binary in `public/` with no provenance is a file nobody can reason about later. The comment says where it came from and that reuse is a permission question nobody outside this repository has answered. |
| D5 | No `.ico`. | It would have to be generated from the PNGs by a tool this repository does not have, to serve browsers that all support PNG favicons. The `.ico` being deleted is Astro's, so nothing regresses. |
| D6 | No preview-specific variant. | From the intent's constraints: offered and declined, because the nav's `PREVIEW` badge already covers it (spec 0001 D7). |

## 2. Design

```
site/public/favicon-32.png        575 B   ← rel=icon, sizes=32x32
site/public/favicon-192.png      1946 B   ← rel=icon, sizes=192x192
site/public/apple-touch-icon.png 1814 B   ← rel=apple-touch-icon
site/public/favicon.svg          deleted  (Astro's)
site/public/favicon.ico          deleted  (Astro's)
```

`Base.astro` replaces its single `<link rel="icon">` with three, each built from
`import.meta.env.BASE_URL`, and carries the provenance comment from D4.

4.3 kB of assets. The `page_weight` band measures the HTML document rather than its
subresources, so it is unaffected either way.

## 3. Deliberate omissions

- **No `.ico`.** D5.
- **No dark-scheme variant.** Browsers do not theme favicons, and `prefers-color-scheme` in a
  `<link media>` is supported unevenly enough that it would be decoration.
- **No `site.webmanifest`.** Nobody installs this as an app.
- **Nothing about licensing is resolved.** The intent records that reusing a company's mark is
  a permission question and that nobody outside this repository has been asked. That is still
  true, and this spec does not pretend otherwise.

## 4. Risks

| Risk | Mitigation |
| --- | --- |
| **The mark is unreadable at 16px**, which is the size a browser tab actually draws. | 32×32 is the smallest the source publishes, and browsers downscale it. Checked by looking at the live tab after deploy — it is the only way to know, and it is one glance. |
| **A stale `favicon.ico` in a browser cache** keeps showing Astro's mark after deploy. | Expected, and not a bug. Hard-refresh, or accept that returning visitors see the old icon for a while. Worth knowing before concluding the change failed. |
| **The CDN URL the assets came from is versioned** (`rev-f75a378`) and will eventually 404. | Irrelevant after the fact: the bytes are committed to this repository. It matters only if someone tries to re-fetch from the same URL later, which is why D4 records the source rather than the URL alone. |
| **Deleting `favicon.svg` while something still references it.** | `grep` says `Base.astro` is the only reference in `site/`, and it changes in the same commit. Section 09 mentions `/favicon.svg` in prose about a past bug; that is history and stays accurate. |

## 5. How completion is proven

- `npm run verify` green at both base paths, including the link crawl — which is what catches
  a favicon path that 404s.
- The built HTML references `/sdlc/favicon-32.png`, not `/favicon-32.png`.
- No `favicon.svg` or `favicon.ico` left in `site/public/`.
- The deployed tab shows the mark rather than Astro's.
