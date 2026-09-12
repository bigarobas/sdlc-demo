---
slug: real-vs-shell
title: What is real here, and what is a shell
stage: honesty
---

A demo that hides its gaps teaches the wrong lesson. Everything above is running. Four things
are not, and they fail in two different ways. The first three are hollow on purpose, and the
reason is the same in each case: cost. The fourth is not hollow at all — it is fully built and
it does not reliably work, which is the more uncomfortable kind of gap to label.

### Evals <span class="shell">partial</span>

`evals/run.mjs` costs nothing and asserts a lot. It checks that the guardrails still
deny what they claim to deny, and that generated artifacts keep their required shape. Loosen a
regex in a hook and CI goes red.

What is missing is any judgement of _quality_ — no LLM-as-judge, no behavioural scoring. That
is the most token-hungry idea in the playbook, and on a Pro plan it would compete with the
demo itself. The cheap half still earns its place: it catches the failure you would not notice.

### Agentic security review <span class="shell">stub</span>

`npm audit` runs. The agent step is written and commented out. A static site has almost no
attack surface, and inventing a finding to make the slide look better would be exactly the
dishonesty this site argues against.

### Control bands <span class="shell">toy metrics</span>

The mechanism is real: a cron job reads `bands.yaml`, checks the live site, and opens an issue
on breach — deterministically, with no tokens. But the thresholds are availability, page weight
and build time, because this site has no users. There is no error rate to watch and no
latency percentile to defend. The loop closes; it just closes around a toy.

### The automatic PR review <span class="shell">unreliable</span>

It runs on every pull request. Roughly one run in five actually posts a review.

This is not the reviewer declining. Its own eligibility check says, in as many words, _"it
NEEDS code review — not a trivial change"_ — and then the run ends anyway. The last thing the
model says before it stops is:

> Waiting for the two background agents (PR eligibility check, CLAUDE.md discovery) to
> complete before continuing.

It spawns background subagents, yields its turn to wait for them, and the session ends.
Nothing wakes it. That is a race, and the giveaway is that the durations have no pattern
whatsoever: 23s, 57s, 137s, 349s, 551s. Twenty runs later the spread has the same shape —
12s at one end, 534s at the other, and nothing about a given pull request that predicts
which you get.

**When it wins the race it is very good.** On the run that worked it produced seven findings
in thirty-five turns, two of which were about to break the live demo: an issue template that
applied its own label, so the deliberate on-stage triage gesture could never happen; and a
deploy whose approval would have published a file the site does not render, leaving the
climax of the demo showing a byte-identical page. Neither had been caught by a human reading
the same text.

It also got one thing confidently wrong, estimating a workflow at "tens of seconds to a
couple of minutes" when three measured runs all took twenty seconds. The finding was right,
the reasoning was not — which is the correct way to hold all of this.

**That one good review cost $3.75.** A silent one costs about $0.15. On a Pro plan, paying
roughly four dollars for a one-in-five chance of a review is a worse deal than asking for one
by hand when you want it, which works every time. The automatic version stays because it is
honest to show a thing that half-works; the reliable path is a comment saying
`@claude review this PR`.
