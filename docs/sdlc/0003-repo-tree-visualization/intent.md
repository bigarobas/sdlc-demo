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

All five answered by bigarobas on 2026-09-14, in a comment on
[the drafting pull request](https://github.com/bigarobas/sdlc-demo/pull/47). Transcribed here
because a comment on a merged pull request is read by nobody and by no script — which is the
mistake that produced the eval now guarding this section.

1. What counts as "three folder structure with lines" — connecting/branch lines between nested
   items (a classic tree-view look), or something else?

   **Answer:** branch/connector lines in a tree view.

2. Where do the per-file short descriptions come from — hand-authored prose, or pulled from
   each file's own description (a skill's frontmatter, a hook's leading comment)? If pulled
   from source, how is drift prevented?

   **Answer:** from the files, and from the agent's understanding of the workflow.

   _Drift is therefore not prevented, by decision._ An agent reads the repository once and
   writes prose into the page; nothing keeps it true afterwards. Taken together with answer 5
   this is a deliberate, recorded trade, and it is the gap
   [intent 0049](../0049-generated-repo-tree/intent.md) exists to close. The spec must say so
   plainly on the page, because section 05 claims "nothing here is illustrative" a few lines
   above this tree, and that claim has already been wrong once.

3. Which files are listed individually versus grouped — only the ones currently behind a glob,
   or every workflow and top-level config too?

   **Answer:** every workflow file and top-level config currently shown.

4. Is interactivity — expand/collapse, hover — in scope, or must the whole tree render on load?

   **Answer:** in scope, and wanted: a very short description visible, with more detail
   collapsible.

5. Does the section need to stay in sync automatically, or is a point-in-time hand-maintained
   representation acceptable?

   **Answer:** no automatic sync for now.

   > "lets create a good representation first then in another intent we will create the synch"

   That other intent is [0049](../0049-generated-repo-tree/intent.md), already filed. The two
   should not be built in parallel by different people: 0003 ships the representation, 0049
   removes the possibility of it being wrong, and whichever is specced second inherits
   constraints from the first.

## Source

Drafted from [issue #46](https://github.com/bigarobas/sdlc-demo/issues/46).
