---
slug: real-vs-shell
title: What is real here, and what is a shell
stage: honesty
---

A demo that hides its gaps teaches the wrong lesson. Everything above is running. These three
are deliberately hollow, and the reason is the same in each case: cost.

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
