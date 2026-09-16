# Intent 0072 — the site's favicon is still Astro's default

- **Status:** accepted
- **Author:** Rashid Ghassempouri
- **Date:** 2026-09-16
- **Issue:** [#72](https://github.com/bigarobas/sdlc-demo/issues/72)

> Drafted and accepted interactively with `/intent`, in one sitting, rather than read and
> accepted separately. The questions below were answered out loud before this file existed.

## Problem

`site/public/favicon.svg` is the mark Astro scaffolds with, unchanged since the project was
created on 2026-09-08. Every browser tab, bookmark and history entry for
`https://rashid.fr/sdlc/` shows the Astro logo.

So a site whose entire argument is that it was built by the process it describes is, in the
one place a browser shows an identity, wearing somebody else's.

It is small and it is visible constantly — on the projector during the talk, in every
screenshot, and in the tab strip beside however many per-intent previews are open at the time.

## Proposed outcome

The tab shows this site's intended identity rather than the framework's.

Once done:

- `https://rashid.fr/sdlc/` and every preview show the chosen mark, at the sizes browsers
  actually render — 16px included, where most marks stop being legible.
- The asset is referenced through `import.meta.env.BASE_URL`, as the existing one already is.
  Both deploy targets live in a subfolder and an absolute path 404s; that bug has shipped here
  once already.
- Nothing about the existing `.ico` fallback silently breaks.

## Affected systems

- `site/public/` — the favicon assets
- `site/src/layouts/Base.astro` — already references `${base}favicon.svg`, and should not need
  to change
- Nothing else. No workflow, no credential, no dependency.

The chosen mark is a third-party asset rather than something drawn here, so obtaining it is a
real step in the spec rather than a detail.

## Constraints

Both settled during drafting, so neither is an open question:

- **The mark is Digital Virgo's actual favicon**, from digitalvirgo.com. The alternative — a
  new mark in the DV palette already sitting in `global.css` — was offered and declined.

  The trade was named before deciding: `rashid.fr/sdlc/` is a public personal site, so shipping
  a company's real mark reads as official affiliation to anyone who lands on it. That is the
  operator's call. It is recorded here because a decision with a reason attached can be
  revisited, and one made silently cannot.

- **Preview and production share one favicon.** A distinct preview mark was offered and
  declined — the nav's `PREVIEW` badge already covers that ground (spec 0001 D7). If several
  per-intent previews open at once make the tab strip unreadable, that is a separate, later
  observation.

- Zero tokens and no new dependency. This is an asset and a link tag.

## Open questions

None. Both decisions were taken during drafting and are recorded above as constraints.

The nearest thing to an open question is licensing: reusing a company's mark on a personal
site is a permission question rather than a technical one, and nobody outside this repository
has been asked. It is stated here so that it is on the record, not because it blocks the work.

## Notes

The request as made was "add a favicon". Looking first showed there already is one — so the
problem is not absence, it is that the site is wearing the framework's identity. The framing
changed because someone checked before writing, which is the cheapest place for a framing to
change.
