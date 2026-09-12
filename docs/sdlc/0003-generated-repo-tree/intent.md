# Intent 0003 — the repository tree on the site is hand-maintained and went stale

- **Status:** draft
- **Author:** Rashid Ghassempouri
- **Date:** 2026-09-13

## Problem

Section 05 of the site prints a tree of the repository — skills, agents, hooks, artifact
directories and every workflow with a note saying whether it spends quota. It is written by
hand in markdown, and on 2026-09-13 a read-through found it wrong in four ways at once:

- three workflows missing (`checks.yml`, `security.yml`, `digest.yml`)
- the derived count under it, "four of the seven workflows spend no tokens", wrong as a result
- one skill missing (`sdlc`)
- only `0000-bootstrap` shown under `docs/sdlc/`, when two further cycles had shipped

Nothing failed. The build stayed green, every link resolved, all 22 evals passed, and the
page went on describing a repository that had not existed for several weeks. The prose was
corrected by hand in `fix/read-through-corrections`, which fixes today's copy and not the
mechanism.

The mechanism matters here more than usual, because of where the tree sits. The very next
section on the page — 05a, the generated pipeline diagram — argues that **"a diagram that is
maintained goes stale; a diagram that is generated cannot"**, and enforces it: `npm run
verify` regenerates the diagram and fails on drift. The one hand-maintained inventory left in
the repository is the one immediately above that sentence, and it is the one that went stale.
A reader who checks will find the counter-example printed above the claim.

This is also a demo risk rather than only an embarrassment: the site is the evidence for the
talk, and an audience member with the repository open can find the discrepancy faster than it
can be explained from the stage.

## Proposed outcome

The tree in section 05 is derived from the repository rather than typed, and cannot silently
disagree with it.

Concretely, once this is done:

- Adding, removing or renaming a workflow, skill, subagent, hook or intent directory changes
  what section 05 renders, with nobody editing section 05.
- Whether a workflow spends quota is stated once and read from there, not counted by a human.
- The sentence under the tree that counts free versus agent workflows agrees with the tree
  by construction.
- `npm run verify` fails if the rendered tree does not match the repository, the same way it
  already fails on diagram drift and on unformatted code.
- Anything that genuinely cannot be derived — what a workflow is *for*, in words — is
  hand-written in exactly one place, and something asserts that no entry is missing.

The test that this happened: delete a workflow file, run `npm run verify`, and watch it go
red without touching `site/`.

## Affected systems

- `site/src/content/sections/05-this-repo.md` — the section that currently holds the tree
- `scripts/diagram/model.mjs` — already derives workflows with their triggers, environments,
  secrets and agent usage; also skills, subagents, hooks and bands
- `scripts/diagram/annotations.json` — already the hand-written half of exactly this problem,
  already covered by an eval that requires every derived node to have an entry
- `scripts/check.mjs` and `scripts/verify.mjs` — where a drift check would be wired
- `evals/run.mjs` — where the completeness assertion would live
- No external service, no credential, no CI permission change.

## Constraints

- **Zero tokens.** This must be a script, like the diagram and the evals. Stage 4 is
  deterministic and stays that way; a generated tree that needs a model to regenerate is a
  quota dependency in the one part of the pipeline that must never fail during the talk.
- **Claude Pro.** Implementation cost is one agent cycle, in the region of $0.20–$0.70 based
  on intents 0001 and 0002.
- **Demo date 2026-09-23**, demo-ready 2026-09-16, rehearsals 09-14 and 09-21. Anything that
  destabilises `npm run verify` after 09-16 is worse than the stale tree it replaces.
- Astro content collections render markdown; a tree injected into a section is a rendering
  question, not only a script question.
- The site is long-scroll with a sticky nav. Section 05 must not become materially longer —
  `checks.yml`, `security.yml` and `digest.yml` already made it grow by three lines.
- The existing `annotations.json` covers 27 diagram nodes and must not be forked into a second
  hand-written list that can disagree with the first.

## Open questions

Things a human must decide before Stage 2:

1. **Does the tree render from data, or is the markdown file regenerated and committed?**
   Rendering from data means section 05 can never be stale. Regenerating a committed file
   means the tree stays diffable in pull requests and greppable in the repository, the way
   `docs/PIPELINE.md` already is. The diagram does both; this may not need to. — Rashid
2. **Does the description of each workflow come from `annotations.json`, or from a comment
   in the workflow file itself?** The annotations file is the established pattern and already
   has a completeness eval. Reading the first comment line out of each workflow would put the
   description next to the thing it describes, which is where it stays accurate — but it is a
   second convention doing the first one's job. — Rashid
3. **Does this extend to the rest of the tree, or only the workflow block?** Workflows are
   where the drift actually happened. Skills, agents and intent directories drifted too, but
   they are a plain directory listing and cheaper to derive. Doing all of it is more code;
   doing part of it leaves a hand-maintained remainder that can go stale again. — Rashid
4. **Is section 05 the only consumer?** `docs/PIPELINE.md` and the SVG already describe the
   pipeline for different audiences. If the answer is that these should converge, that is a
   bigger intent than this one and should be said now rather than discovered at spec time.
   — Rashid

## Notes

Found by a read-through on 2026-09-13, not by any check in the repository. That is itself the
argument: every other inventory here is verified by machinery, and this one was verified by
somebody happening to read it.
