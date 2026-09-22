# Intent 0079 — separate each section's technical summary from its diary

- **Status:** accepted
- **Author:** Claude Sonnet 5
- **Date:** 2026-09-22
- **Issue:** [#79](https://github.com/bigarobas/sdlc-demo/issues/79)

## Problem

The site's sections (`site/src/content/sections/*.md`) currently mix two different kinds of
writing in one continuous scroll. A section like `09-scars.md` states what broke ("A hardcoded
`/favicon.svg`. Both deploy targets live in a subfolder, so the path Astro's own template ships
with returns 404.") in the same paragraph register as reflection on why it mattered or what it
revealed ("Printing the right output is not the same as succeeding."). There is no structural
seam between the two.

The issue (reported by the repository owner, in issue #79) names this directly: for each
section, a reader currently gets one register — concise technical fact and honest/reflective
commentary — interleaved, with no way to read only one of them. A reader who wants "what
happened, plainly" cannot skip past the "why it matters" prose, and a reader who wants the
honest post-mortem material cannot find it without reading past the technical parts first.

## Proposed outcome

Someone reading any section of the site can distinguish, and separately consume, two kinds of
content:

1. A concise, neutral, technical statement of what is true — short, to the point.
2. A collapsed-by-default "diary" holding the more reflective material — honesty, analysis,
   post-mortem, insights, clarifications — that a reader can choose to expand.

This is true for "each section of the site," per the issue, which — read literally — means
`site/src/content/sections/*.md` (currently ten files) rather than the site as a whole. Whether
"each section" in fact means all ten, some subset, or something else at the level of the
page/component structure is a question for the spec, not decided here.

Once done, a reader scanning the page fast sees only the technical layer by default, and the
diary material is present but does not lengthen that fast pass.

## Affected systems

- `site/src/content/sections/*.md` — the ten section content files, which currently hold both
  registers as undifferentiated prose within a single content field.
- Whatever renders those sections into the page — at minimum `site/src/layouts/Base.astro`,
  and possibly a section-rendering component if a distinct one exists; not yet inspected past
  confirming `Base.astro` references `sections`.
- The content collection schema for `sections` (if one exists) may need to gain a field, or the
  authoring convention may need to change, to hold two registers per section instead of one.
  Which of these is the mechanism is a design decision, not stated here.

## Constraints

None identified during drafting. No deadline, budget, or account was mentioned in the issue or
elsewhere. Cost constraints from `AGENTS.md` apply as they do to all work here: this is a
content and possibly a component change, not a new CI job, so no new recurring cost is implied
by the problem as stated.

## Open questions

- **What exactly counts as "a section"?** The issue says "each section of the site." The
  content collection has ten files today (`01-thesis.md` through `11-reproduce.md`, with a
  `05a-pipeline.md`). Does every one of them need both a technical summary and a diary, or only
  the ones that currently carry post-mortem material (e.g. `09-scars.md`, `10-cost.md`)? A
  section like `01-thesis.md` reads as argument rather than as a mix of fact-and-reflection —
  it is not obvious a diary applies to it at all.
  Answer :  every part that doesn't directly help understanding the technical implementation should be moved to diary.
- **What does "collapsable" mean on a long-scroll, no-JS-navigation site?** House style
  (`.claude/skills/house-style/`) governs the site's existing interaction patterns; whether a
  collapsible disclosure element fits that system, and what triggers/closes it, is a design
  question for the spec stage.
  Answer : a content that the user can open/close and makes the default read simpler. Only the user that whants to now more will open a colapsed diary entry.
- **Does existing section prose get rewritten, or does new content get authored into the new
  structure going forward?** Retrofitting ten existing files into two registers each is a
  larger and more subjective task than adding the structure and filling it in over time. The
  issue does not say which is wanted.
  Answer : Both existing and new content should follow this
- **Is "technical summary" meant to replace the current prose, or sit above it as a new,
  shorter layer?** If the former, the site's current voice (documented as deliberately plain
  and specific, not neutral/marketing) may already satisfy part of the ask; if the latter, every
  section grows a second piece of writing.
  Answer : it should replace the current prose

These are named as open questions rather than answered here, per the issue-drafting rules —
answering them is the spec stage's job, not this one's. They must be answered by editing this
file on the `intent/0079-separate-technical-diary` branch, not in a pull request comment.
