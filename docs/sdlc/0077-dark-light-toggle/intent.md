# Intent 0077 — dark/light mode

- **Status:** draft
- **Author:** Claude Sonnet 5
- **Date:** 2026-09-23
- **Issue:** [#77](https://github.com/bigarobas/sdlc-demo/issues/77)

## Problem

The issue asks to "Add dark/light mode to the website," with no further detail in the body.

Read literally against the current site, this is not starting from nothing: `site/src/styles/global.css`
already defines a full dark palette and applies it via `@media (prefers-color-scheme: dark)`, and
also recognises a `data-theme="dark"` / `data-theme="light"` attribute on `:root` that would
override the OS preference. But nothing in the site ever sets that attribute — there is no
toggle control, and no script that reads or writes it. `site/src/layouts/Base.astro` has a
`nav-toggle` (for the mobile navigation menu) but no theme toggle.

So today, a visitor's site appearance is fully determined by their OS/browser color-scheme
setting. Someone who wants to read the site in a different mode than their system default
currently cannot, and has no control to try.

Whether that gap — no manual override — is the actual problem the issue means, or whether the
reporter is unaware the site already follows system preference and wants something else
entirely, is not stated in the issue and is not decided here.

## Proposed outcome

Someone reading the site can tell the difference between the site's appearance and the modes it
supports, and — if a manual override is what's wanted — can choose light or dark independent of
their OS setting, with that choice legible while browsing.

The precise mechanism (a visible toggle control, a preference stored across visits, which pages
it applies to) is a design decision for the spec, not stated here.

## Affected systems

- `site/src/styles/global.css` — already defines the light and dark token sets and the
  `data-theme` override hooks; may need no new tokens, only something that sets the attribute.
- `site/src/layouts/Base.astro` — the shared layout that would host any toggle control and any
  script wiring it to `data-theme`, alongside the existing `nav-toggle` script.
- No other repository, service, or external provider is implicated; this is a static-site,
  client-side concern only.

## Constraints

None stated in the issue. No deadline, budget, or account was mentioned. Per `AGENTS.md`, this
is a site content/component change, not a new CI job, so no new recurring cost is implied by the
problem as stated.

## Open questions

- **Is the gap "no manual override," or something else?** The issue text is a single line title
  and an empty body. It does not say whether the reporter knows the site already respects
  `prefers-color-scheme`, or is asking for a toggle, or is asking for something the current
  implementation does not cover at all (e.g., only dark mode being wrong somewhere, or a
  specific page not honouring the palette). Whoever accepts this intent must confirm the reading
  above or replace it.
  ANSWER: add it anyway with simple switch of text and background color do not change other components
- **Should the choice persist across visits/pages**, or apply only for the current page load?
  Not stated in the issue.
  ANSWER: no
- **Where should the control live** — global nav, a floating control, per-page — and does it
  need to be reachable without JavaScript? Not stated in the issue; a design decision for the
  spec, not this document.
  ANSWER: Global nav

Open questions must be answered by editing this file on its branch, not in a pull request
comment — a comment on a merged pull request is read by nobody and by no script.
