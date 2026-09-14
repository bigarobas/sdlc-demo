# Intent 0003 — Graphical repo tree in the implementation section

- **Status:** accepted
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

   _Narrowed on 2026-09-14, with answer 5._ This answer originally meant that everything in
   the tree — what exists and what each thing is for — was written once and then went stale.
   Now only the **prose** is: the structure is derived and drift-checked, so a file that is
   added, removed or renamed changes the tree without anyone touching it.

   What remains true is that a description can be present and wrong. An eval forces one to
   exist for every derived path; nothing checks that it is accurate. The spec must say so
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

   ~~**Answer:** no automatic sync for now.~~

   > ~~"lets create a good representation first then in another intent we will create the synch"~~

   **Superseded on 2026-09-14 by spec D1, before any code was written.** The answer now is:
   the structure is generated from the first commit, and
   [0049](../0049-generated-repo-tree/intent.md) is absorbed into this intent rather than
   sequenced after it.

   The original answer was reasonable and was overtaken by a measurement. `deriveModel()`
   already returns 22 nodes carrying a file path — 10 workflows, 5 hooks, 5 skills, 2
   subagents, each with `id`, `kind`, `label` and `file` — and has done since the pipeline
   diagram shipped. The work this answer deferred was mostly already built.

   The deferral also assumed the split was between a static version and a generated one. It
   is not: it is between **structure and prose**. Structure cannot go stale once derived;
   prose is hand-written under either plan. So doing the static version first would not have
   validated the design more cheaply — whether the tree _looks_ right is independent of where
   its data comes from — it would have meant hand-writing a file listing, checking the visuals
   against it, and discarding it.

   What survives from the original answer is the honest part: the descriptions are still
   written by a human or an agent and still go stale. That is now a sentence on the page
   rather than the shape of two intents.

   The struck text is kept rather than deleted so the decision that was actually taken on
   2026-09-14, and the reason it changed, both remain readable.

## Source

Drafted from [issue #46](https://github.com/bigarobas/sdlc-demo/issues/46).
