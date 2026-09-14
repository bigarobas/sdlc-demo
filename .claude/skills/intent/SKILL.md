---
name: intent
description: Stage 1 (Plan). Turn a raw idea, a request, or a GitHub issue into a docs/sdlc/NNNN-slug/intent.md artifact. Use before any design or implementation work, and whenever someone describes a problem without an accepted intent on record.
---

# Writing an intent

An intent states a **problem and a desired outcome**. It does not state a solution. If you
find yourself naming files, libraries or APIs, you have started the spec early — stop, and
move that material to the open questions.

The intent is the cheapest artifact to change and the most expensive to get wrong, because
everything downstream inherits its framing.

## The id is the issue number

`docs/sdlc/0046-repo-tree-visualization/` is the intent drafted from issue #46. Four digits,
zero-padded; more than four once the repository gets past issue 9999.

**Every intent has an issue, and the issue number is the id.** If the work started as a
conversation rather than an issue, open the issue first. That is not paperwork — it is where
the id comes from and where people argue about the framing before anyone writes markdown.

The rule exists because the old one broke. Incrementing from the directory listing means the
number is chosen at drafting time, so two people drafting at once pick the same one and
neither can tell. That happened: `0003-generated-repo-tree` and `0003-repo-tree-visualization`
were filed within a day, by a human and by `agent-intent.yml`, and the collision only became
visible when both were on disk. GitHub already allocates unique numbers; use those instead of
inventing a second counter that nobody coordinates.

It also makes the trail two-way. The id tells you where the discussion is, and the issue
tells you where the artifact is.

Numbers will have gaps — 0034, 0046, 0051. That is what monotonic-but-not-sequential looks
like, and it is not a problem.

`0000` to `0003` predate this rule and keep their numbers. Do not renumber them; the links and
commit messages that point at them are worth more than a tidy sequence.

One issue, one intent. If an issue turns out to hold two problems, open a second issue — the
same rule as "one intent, one problem", enforced one level up.

## Steps

1. Take the id from the issue number, zero-padded to four digits. Slug is kebab-case, three
   or four words.
2. Write `docs/sdlc/NNNN-slug/intent.md` using the template below.
3. Ask the questions you cannot answer yourself. Do not invent constraints, dates, budgets
   or account names — leave them as open questions and say who must answer.
4. Stop. The intent needs a human `accepted` before Stage 2 begins.

## Template

```markdown
# Intent NNNN — <short title>

- **Status:** draft | accepted | superseded
- **Author:** <name>
- **Date:** <YYYY-MM-DD>

## Problem

What is wrong today, for whom, and how you know. Observable, not speculative.

## Proposed outcome

What is true once this is done. Written so that someone else could tell whether it happened.

## Affected systems

Repositories, services, accounts, external providers.

## Constraints

Deadlines, budget, runtime limits, skills available, anything already decided elsewhere.
Include cost constraints explicitly — they shape design more than most requirements.

## Open questions

Things a human must decide. Name the decision, not just the topic.
```

## Rules

- The four `##` headings Problem, Proposed outcome, Affected systems and Constraints are
  required. `evals/run.mjs` asserts they exist.
- One intent, one problem. Two problems means two intents.
- Keep it under a page. An intent nobody reads is a formality, not a control.
- When the intent came from a GitHub issue, link the issue and keep the reporter's words
  where they were precise. Do not tidy away a good symptom description into vagueness.
- When it came from a control-band breach, include the measurement that breached and its
  threshold.
