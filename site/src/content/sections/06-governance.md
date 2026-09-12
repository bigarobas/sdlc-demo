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

### The repository is public, so anyone can open a pull request

That sounds alarming and mostly is not, because the platform already draws the line in the
right place. **Secrets are never passed to a workflow triggered from a fork**, and the token
such a run does get is read-only. A stranger's pull request can spend CI minutes; it cannot
reach the FTP credential or the Claude quota, because neither exists on its side of the fence.
The `@claude` workflow is the one place a stranger's words reach an agent directly, since it
triggers on any issue or comment containing `@claude`. What stops that being a problem is the
action, not this repository: `claude-code-action` checks that the person who triggered it has
write access, and refuses otherwise. Worth stating precisely, because reading the workflow
file will not show you that check — it is a default of the action, and defaults can change
under you. The repository's own guard is the one below it.

Two things were added on top:

- **`CODEOWNERS` plus a branch rule.** An agent's pull request is authored by `claude[bot]`,
  not by a person, so a named human has to approve it before it can merge. The agent cannot
  merge its own work.
- **Fork guards.** The preview and review workflows refuse to start on a pull request from a
  fork at all. They would have failed anyway for want of credentials; not starting is cheaper
  and reads as a control rather than a bug.

### Prompt injection is contained here, not prevented

An agent reads pull request diffs and issue bodies, and on a public repository anyone can
write those. So the drafting workflow triggers on an issue being **labelled**, never on one
being **opened** — applying a label needs write access, which makes the trigger _a maintainer
decided to process this_ rather than _a stranger typed something_.

The prompt then states plainly that the issue body is untrusted data describing a problem, and
never instructions. When it was run for real, the agent volunteered this in its own output:

> No other instructions, commands, or configuration changes were requested by the issue text
> itself; the issue body is a standard automated control-band report with no attempt to direct
> this agent.

That is worth more than a promise, because it is auditable. But the honest word is
_contained_, not _prevented_: a hostile issue can still produce a strange artifact. It just
produces it inside a pull request that a human reads, and that `CODEOWNERS` requires a human
to approve, before it reaches anything that matters — the same containment the deploy gate
relies on.
