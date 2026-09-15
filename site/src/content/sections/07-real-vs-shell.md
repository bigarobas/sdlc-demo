---
slug: real-vs-shell
title: What is real here, and what is a shell
stage: honesty
---

A demo that hides its gaps teaches the wrong lesson. Everything above is running. Four things
are not, and they fail in three different ways. The first three are hollow on purpose, and the
reason is the same in each case: cost. The fourth was fully built, measured, and switched
off — which is the most uncomfortable kind of gap to label, because it is the one where the
honest answer cost something to find out.

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

### The automatic PR review <span class="shell">switched off</span>

It used to run on every pull request. It no longer runs on anything unless someone asks, and
the reason is the only kind worth acting on:

| Review runs         | 58  |
| ------------------- | --- |
| Comments posted     | 2   |
| On the last fifteen | 0   |

Two inline comments, on pull requests numbered in the twenties. Nothing at all on anything
merged in the week before it was removed — and that week was the busiest this repository has
had.

**It was never declining.** Its own eligibility check says, in as many words, _"it NEEDS code
review — not a trivial change"_, and then the run ends anyway. The last thing the model says
before it stops is:

> Waiting for the two background agents (PR eligibility check, CLAUDE.md discovery) to
> complete before continuing.

It spawns background subagents, yields its turn to wait for them, and the session ends.
Nothing wakes it. That is a race, and the giveaway is that the durations have no pattern
whatsoever: 23s, 57s, 137s, 349s, 551s.

**When it won the race it was very good.** The one run that worked produced seven findings in
thirty-five turns, two of which were about to break the live demo: an issue template that
applied its own label, so the deliberate on-stage triage gesture could never happen; and a
deploy whose approval would have published a file the site does not render, leaving the climax
of the demo showing a byte-identical page. Neither had been caught by a human reading the same
text.

It also got one thing confidently wrong, estimating a workflow at "tens of seconds to a couple
of minutes" when three measured runs all took twenty seconds. The finding was right, the
reasoning was not — which is the correct way to hold all of this.

That review cost $3.75. A silent one costs about $0.15.

**So it is now `workflow_dispatch` and nothing else.** The capability is unchanged and the file
still holds every note about how it fails; what changed is that it no longer fires on its own.
Asking for a review by hand — `@claude review this PR` — has worked every single time.

Two things made the decision rather than one. The first is the table above. The second is
subtler: pull requests here are opened as drafts so the cheap checks run and the expensive one
does not, and a draft cannot be merged without being marked ready. With the automatic trigger
in place, _every merge_ therefore ended with a mandatory agent run. The iteration loop was free
right up to the last step, which was never free.

There is a version of this page where the review stays, because a half-working autonomous
reviewer is a better slide than a switched-off one. This is the site that argues the honest
version beats the impressive-sounding one, so: it was built, it was measured over fifty-eight
runs, it produced two comments, and it was turned off.
