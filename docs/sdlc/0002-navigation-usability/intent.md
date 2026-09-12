# Intent 0002 — Improve the section navigation

- **Status:** accepted
- **Author:** claude[bot] (drafted from GitHub issue #34, reported by bigarobas)
- **Date:** 2026-09-12

## Problem

The sticky section navigation is hard to use on both desktop and mobile, per
[issue #34](https://github.com/bigarobas/sdlc-demo/issues/34).

On desktop, the reporter describes the navigation as too small, with the section numbers
too close to the titles. On mobile, the navigation sits at the top of the page as a
horizontally-scrolling strip, which the reporter says is unusable, and there is no way to
tell which section of the page you're currently in once you've scrolled past the nav.

## Proposed outcome

On desktop, the navigation is comfortably readable: the reporter suggests the navigation
width could be at least twice as large as it is today, with larger text and clearer
separation between section numbers and titles.

On mobile, a visitor can open and close the navigation on demand rather than scrolling it
horizontally, and can tell which section of the page they're in without having to scroll
back to the nav.

The issue's own language leans toward specific UI mechanisms (a toggled side menu on
mobile, sticky section titles in the page body) — those are the reporter's suggestions for
how to reach the outcome, not commitments made here. Which mechanism to use is a design
decision for the spec stage.

## Affected systems

`site/` — the section navigation component and its styling (`site/src/styles/global.css`
and whatever layout/component renders it).

## Constraints

- Keep the fix simple — the reporter explicitly asked not to overcomplicate it.
- Must follow the site's existing house style constraints
  (`.claude/skills/house-style/`); this is a long-scroll site with a sticky section nav
  and no keyboard deck navigation, so any redesign has to stay compatible with that model.

## Open questions

- What counts as "too small" on desktop — is there a specific viewport width or a
  concrete size/contrast measurement to design against, or is visual judgement sufficient?
- Should the mobile menu toggle be a hamburger-style icon, a labelled button, or something
  else? The issue only asks for "a simple menu button."
- For "sticky section titles in the body of the page," does the reporter mean a persistent
  current-section indicator, sticky headings per section, or something else? The issue
  text underspecifies this, and resolving it belongs at the spec stage regardless.
- No specific device, browser, or breakpoint was named for the mobile problem — should the
  fix target a particular breakpoint set already used elsewhere in the site, or does that
  also wait for the spec stage?
