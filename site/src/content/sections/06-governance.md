---
slug: governance
title: The agent acts up to the gate
stage: governance
---

The rule is simple to state: **the agent may act up to the production gate and cannot pass
it.** What matters is how that is enforced, because "we told it not to" is not enforcement.

### A hook it cannot argue with

Ask this repository's agent to edit a workflow file and it gets this back — not a policy it
chose to respect, but a script that returned `deny` before the tool ran:

> Blocked by protect-guardrails: `.github/workflows/deploy.yml` is a guardrail file, and the
> agent cannot edit its own guardrails. CI workflows define what runs without a human. An
> agent that can edit them can grant itself new powers.

The same thing happens one level up, and we did not build it: GitHub's review action refuses
to run when a pull request has modified the reviewer's own workflow file. **A pull request
cannot rewrite its own reviewer.**

### The boundary that actually holds

Be honest about the limit. A hook intercepts the tool calls it matches. A determined agent
with shell access can write the same file another way — and during this project, a blanket
`prettier --write .` did exactly that by accident, sailing straight past the hook guarding the
`Write` tool.

So hooks stop drift and accidents, which is the failure mode that actually happens. They are
not a security boundary. The boundary that holds is the one where the credential is simply not
present:

The FTP password for `rashid.fr` lives in a GitHub Environment with a required reviewer. It
does not exist for the build job, for any agent job, or for any workflow that has not been
approved by a named human. The agent can write the code, open the pull request and pass every
check. It cannot deploy, because it has nothing to deploy with.
