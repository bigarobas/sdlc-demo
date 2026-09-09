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

## Steps

1. Find the next number: look at existing `docs/sdlc/` directories and increment. Slug is
   kebab-case, three or four words.
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
