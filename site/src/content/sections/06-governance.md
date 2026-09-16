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

### The one that was a promise until last week

Everything above was built early. This one was added after noticing the repository was making
a claim it could not back.

The agent was told never to merge. It never did. But nothing stopped it: `gh pr merge --admin`
on the operator's own credentials would have worked, and the only thing preventing it was the
model reading an instruction in a skill file and choosing to follow it — five times in one
session, each one a decision that could have gone the other way.

That is precisely what the top of this section says is not enforcement.

So the boundary is now a list in a file. `.claude/settings.json` carries an allowlist of the
routine commands and a deny list of the ones that must stay human, and the refusal happens
before the tool runs:

> Permission to use Bash with command `gh pr merge 61 --squash --admin` has been denied.

Different wording from the hook's denial, because it is a different layer. Both are visible,
and neither can override the other — an allowlist entry does not suppress a hook. That was the
assumption the whole design rested on, so it was tested rather than believed: permit the push
verb, attempt a write to the default branch, watch the hook refuse anyway.

**The boundary had a door in it, and writing this is what found it.** `protect-guardrails.mjs`
matched the exact filename `.claude/settings.json`. It did not match
`.claude/settings.local.json` — and local settings take precedence over project settings. One
file write would have granted the agent everything the deny list refuses, while the deny list
sat there looking enforced. Found while planning the change, before shipping it, by taking the
spec's own instruction seriously: verify before believing.

### What is still not enforced, and should be said

Approving a deployment is a click in the Actions tab. Deploying follows from it. **No
allowlist and no hook can reach either** — they are not shell commands.

What holds them is what has always held them: the `production` environment's required reviewer,
and an FTP credential that exists in no other job. That is a real control and a strong one. It
is not the same kind of control as the deny list, and a section that listed the enforced ones
and quietly omitted this would be overclaiming in exactly the way this section warns against.

So the honest summary is narrower than "the agent cannot act": **the agent can go from an
accepted framing to a published preview URL entirely on its own** — no approval, no human step
— and it still cannot reach production. Unattended deployment and a hard boundary, in the same
pipeline. The preview is safe not because the agent is trusted but because that FTP account is
chrooted to the preview directory and cannot see the live site.

Blast radius, not permission. Again.

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
