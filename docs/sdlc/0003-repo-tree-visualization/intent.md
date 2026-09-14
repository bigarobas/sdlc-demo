# Intent 0003 — Graphical repo tree in the implementation section

- **Status:** draft
- **Author:** Claude (drafted from GitHub issue)
- **Date:** 2026-09-14

## Problem

The site's implementation section (`site/src/content/sections/05-this-repo.md`, shown on the
page under the "implementation" stage) renders the repository layout as a single plain-text
code block — a monospaced tree with hand-typed inline comments. The issue reporter
(bigarobas, issue #46) describes this as "just a scrolable text" and asks for something more
graphical: "icons for different folders and file types, three folder structure with lines,
text colors" and "each sub files (all hooks, all askills, etc.) with short descriptions."

## Proposed outcome

A folder-tree representation of the repository's structure that:

- Uses icons to distinguish folder types and file types.
- Shows the tree's structure visually (the reporter's words: "three folder structure with
  lines" — read as connecting lines showing nesting, to be confirmed with the reporter).
- Uses text color to carry meaning, consistent with the site's existing graphical identity
  (see `.claude/skills/house-style/`).
- Lists each sub-file individually (for example, every file under `.claude/hooks/`, every
  skill under `.claude/skills/`) with a short description of what it is, rather than
  collapsing them into a glob as the current text does (e.g. `hooks/*.mjs`).
- Does **not** enumerate every entry under `docs/sdlc/`. Per the reporter, only one example
  chain should appear (they named `0002-navigation-usability` with its `intent`, `spec`, and
  `plan` files) to stand in for the pattern.

Success looks like: a reader can tell, at a glance and without decoding a code block, what
kind of thing each repository entry is, and can read a one-line description of any file that
currently only appears as a glob or a bare path.

## Affected systems

- `site/` — specifically the implementation section content
  (`site/src/content/sections/05-this-repo.md`) and whatever rendering it needs.

## Constraints

- No SVG and no raster image — the reporter was explicit: "Don't make a svg or image."
  Whatever renders this must be markup/CSS (or similar), not a static graphic asset.
- Must respect the site's current graphical identity — house style, not a new visual system
  (`.claude/skills/house-style/`).
- The claim in this section is meant to be literal ("nothing here is illustrative"); a
  visualization that drifts from the actual repository contents would undermine that claim.

## Open questions

- What counts as "three folder structure with lines" — is this asking for connecting/branch
  lines between nested items (a classic tree-view look), or something else? The reporter
  should confirm what they pictured.
- Where do the per-file short descriptions come from — hand-authored prose (as the current
  code block already has for some paths), or pulled from each file's own description (e.g. a
  skill's frontmatter, a hook's leading comment)? If pulled from source, how is drift between
  the displayed description and the real file prevented?
- Which specific files must be listed individually versus grouped — the issue names hooks and
  skills explicitly ("all hooks, all askills, etc."); does this extend to every workflow file,
  every eval, and every top-level config file currently shown, or only to the ones currently
  collapsed behind a glob?
- Is animation, hover, or interactive disclosure (e.g. expand/collapse) in scope, or must the
  whole tree be visible on load?
- Does this section need to stay in sync automatically as the repository changes, or is a
  point-in-time hand-maintained representation (as today) acceptable?

## Source

Drafted from [issue #46](https://github.com/bigarobas/sdlc-demo/issues/46).
