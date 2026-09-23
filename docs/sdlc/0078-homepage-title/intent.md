# Intent 0078 — Main title and subtitle on the page itself

- **Status:** draft
- **Author:** Claude Code (drafted from issue #78)
- **Date:** 2026-09-23

Closes bigarobas/sdlc-demo#78.

## Problem

The page title "The AI-native SDLC, built by one" exists today only as the `<title>` passed
to `Base.astro` and, from there, into the side nav — it is not rendered anywhere in the
scrolling page content itself. A visitor scrolling the main page never sees a title or
framing statement; the first thing rendered is section 01's heading.

The issue reporter (the repo owner) asks for a main title, "AI-native SDLC", and a subtitle,
"A personal experiment based on Claude's proposal", to appear at the top of the main page,
distinct from what the side nav currently shows.

## Proposed outcome

Someone loading the main page sees a title and a subtitle at the top, before the first
section, without having to look at the side nav to learn what the page is. The side nav's
own display of the title is unaffected except where this intent's resolution says otherwise.

## Affected systems

- `site/src/pages/index.astro` — assembles the page and currently passes the title only to
  `Base`.
- `site/src/layouts/Base.astro` — owns the side nav that currently shows the title.
- `.claude/skills/house-style/` — governs how any new heading and subtitle must look, so the
  spec stage should read it before proposing markup or styling.

## Constraints

- House style applies: this is a long-scroll page with a sticky section nav, and any new
  top-of-page element must fit that system rather than introduce a new one.
- No stated deadline or budget in the issue.

## Open questions

Answer these by editing this file on branch `intent/0078-homepage-title`, not in a pull
request comment — a comment on a merged pull request is read by nobody and by no script.

- The issue's requested title text, "AI-native SDLC", differs from the existing page title,
  "The AI-native SDLC, built by one", used elsewhere (browser tab, side nav). Is the new
  on-page title meant to replace that text everywhere it appears, or is it a distinct,
  shorter heading for this one placement only? Who decides: the repo owner.
- Should the side nav keep showing the title once it also appears at the top of the page, or
  is one of the two placements meant to be removed to avoid duplication? Who decides: the
  repo owner, informed by house-style review at the spec stage.
