# Intent 0001 — The page does not say which build it is

- **Status:** accepted
- **Author:** Claude Code (drafted from GitHub issue #15)
- **Date:** 2026-09-11

## Problem

Looking at `rashid.fr/sdlc/` or `rashid.fr/sdlc-preview/`, there is no way to tell which
build you are looking at. During the deploy freeze on 2026-09-10 the production site served
five-merge-old content for seventeen hours and nothing on the page said so — the staleness
was only found by reading workflow run history.

The same ambiguity bites on the preview: it is a single rolling preview, so whichever pull
request updated last wins, and the page gives no clue which one that was.

## Proposed outcome

The footer states which build is being served, so that anyone — including someone in the
audience — can tell at a glance whether the page is current and what produced it. Enough to
answer "is this stale?" without leaving the page.

Likely contents: environment (preview or production), deploy time, the commit it was built
from, and a link back to that commit or its pull request.

## Affected systems

- `site/src/pages/index.astro` and the footer markup
- `.github/workflows/deploy.yml` and `preview.yml`, which know the commit and environment
- Local builds, which have no CI variables and must still produce something honest

## Constraints

- The values must come from the build, not be hand-written — a hand-maintained version
  string is exactly the kind of claim that goes stale, which is the problem being solved.
- A local build has no `GITHUB_SHA`. It should say so rather than inventing a value.
- No extra JavaScript on the page: this is build-time data, not a runtime lookup.
- It must not breach the page-weight control band.

## Open questions

- Commit SHA, pull request number, or both? A PR link is friendlier; not every deploy has one.
- Should the preview footer be visually distinct, so a preview is never mistaken for
  production in a screenshot?
- The issue reporter is `bigarobas` (Rashid Ghassempouri), the repository owner — this intent
  assumes that report is trustworthy and does not itself decide implementation, per the
  intent-stage rule against naming solutions. That belongs to the spec stage.

Source: [bigarobas/sdlc-demo#15](https://github.com/bigarobas/sdlc-demo/issues/15)
