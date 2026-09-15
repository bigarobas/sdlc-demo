# Runbook

How to run this repository, and what to do when it misbehaves. For the talk script, see
[TALK.md](./TALK.md) — that document has a date on it and this one does not.

## The loop, end to end

Worked through with a real example: **adding a credits section to the site.** Every step says
who does it and how, because "edit it on the branch" is not obvious the first time.

### 1. Create the issue — leave it unlabelled

**Issues → New issue.** Title _"Add a credits section to the site"_. Describe the problem —
who it is for, what is missing — not the solution.

```
gh issue create --title "Add a credits section to the site" --body "..."
```

Unlabelled on purpose. Labelling is the trigger, so filing something and deciding to act on it
stay separate acts. Note the number: issue **#62** becomes intent id **0062**.

### 2. Apply the `intent` label

On the issue, right sidebar → **Labels** → gear → tick `intent`.

```
gh issue edit 62 --add-label intent
```

This is also the access control. Applying a label needs write access, so the drafting agent
only ever runs on something a maintainer decided to process — never on what a stranger typed.

### 3. The agent drafts the intent — automatic

Roughly a minute, about $0.19. It creates branch `intent/0062-credits-section`, writes
`docs/sdlc/0062-credits-section/intent.md` with `Status: draft`, opens a pull request, and
comments the link back on the issue.

### 4. Answer the open questions and accept — on the branch

**The step people get wrong.** On the pull request → **Files changed** → the **⋯** menu at the
right of the file header → **Edit file**. Answer each open question inline, and change:

```
- **Status:** draft   →   - **Status:** accepted
```

Then choose **"Commit directly to the branch"**, not "create a new branch".

Answering in a pull request comment does not count. A comment on a merged pull request is read
by nobody and by no script — an eval fails the build if an intent is accepted with its
questions unanswered.

### 5. Merge the intent pull request

```
gh pr merge 62 --squash --delete-branch --admin
git pull
```

`--admin` because `CODEOWNERS` requires an approval the author cannot give themselves.

### 6. Run the cycle

```
/sdlc 0062-credits-section --auto
```

`--auto` does spec, plan and implementation in one pass. Right for a credits section: small
design space, cheap mistake. Drop it whenever the spec contains real choices — run `/sdlc`
three times instead and read each artifact.

The agent opens the pull request **as a draft**. That is the rule, not a preference: a draft
runs the checks, the build and the preview — all free — and skips the review, which is the
only expensive thing in the pipeline.

### 7. The preview appears — automatic

About thirty seconds. A bot comment posts the URL.

### 8. Iterate — this is the cheap loop

Ask for changes, the agent pushes to the branch, the preview redeploys. No review, no merge,
no quota. Repeat until it looks right. **This is where the time should go.**

### 9. Mark it ready

The **"Ready for review"** button at the bottom of the description, or:

```
gh pr ready 62
```

Nothing fires. A draft cannot be merged, so this is only the flag that says the work has
stopped moving. It used to trigger the review, which meant every merge ended with a mandatory
agent run — see _What costs money_ below.

**If you want a review**, ask for one. This is the only path that has ever worked reliably:

```
gh workflow run "Claude Code Review" -f pr=62
```

or comment `@claude review this PR` on the pull request.

### 10. Merge, then approve the deploy

```
gh pr merge 62 --squash --delete-branch --admin
```

If it touched `site/`, the deploy parks at the production gate and Slack says so. To approve:
**Actions** → the running **Deploy** workflow → **Review deployments** → tick `production` →
**Approve and deploy**.

---

**Draft pull requests, since the mechanics are not obvious:**

| Want                    | How                                                                  |
| ----------------------- | -------------------------------------------------------------------- |
| Create one              | `gh pr create --draft`, or the green button's **▾** → _Create draft_ |
| Convert an existing one | PR page → right sidebar under _Reviewers_ → **Convert to draft**     |
| Mark it ready           | **Ready for review** button, or `gh pr ready <n>`                    |

`npm run intents` answers "where is everything" at any point. It is a script, not a
judgement — trust it over memory.

## Commands

| Command                                   | What it does                                                                  |
| ----------------------------------------- | ----------------------------------------------------------------------------- |
| `npm run intents`                         | every intent, its status, its artifacts, what a human must do next            |
| `npm run check`                           | format, evals, diagram drift — about four seconds, builds nothing             |
| `npm run verify`                          | everything `check` does, then builds, serves and link-checks the site         |
| `VERIFY_BASE=sdlc-preview npm run verify` | the same against the preview base path                                        |
| `npm run diagram`                         | regenerate the pipeline diagram after adding a skill, hook, agent or workflow |

Node 22 is required. On the Windows laptop `nvm use` needs elevation and fails silently, so
prefix the PATH instead of trusting the switch:

```
export PATH="/c/Users/rashi/AppData/Roaming/nvm/v22.19.0:$PATH"
```

## When something misbehaves

| Symptom                                                  | Cause                                                                                                                                                | What to do                                                                                                                                                        |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A deploy sits at the gate and later runs say "cancelled" | A run parked at the environment gate holds the concurrency group                                                                                     | Approve or cancel the oldest run. `cancel-in-progress: true` now supersedes rather than queues, so this should no longer freeze — it once did for seventeen hours |
| A review you dispatched completes and posts nothing      | The action spawns background subagents, yields, and the session ends. A race, not a policy                                                           | 58 runs produced 2 comments, which is why it no longer fires automatically. Retry, or ask with `@claude review this PR`, which has never failed                   |
| A preview behaves like an older version of the pipeline  | `pull_request` runs the workflow from the merge ref, so a branch cut before a workflow change runs the **old** workflow                              | Rebase the branch onto current `main`. This is why one preview notification arrived without a Slack link card while production's unfurled                         |
| A commit you made has vanished after a squash merge      | It was committed locally and never pushed                                                                                                            | `git reflog`, find the SHA, `git cherry-pick <sha>`. This has happened once                                                                                       |
| `prettier --check` disagrees between laptop and CI       | Line endings                                                                                                                                         | `.gitattributes` forces `eol=lf`. Do not add `endOfLine: "auto"` — that hides the divergence rather than removing it                                              |
| A bash command is denied and the command looks harmless  | `guard-bash.mjs` matches the raw command string, so a compound command — or prose in a heredoc — containing a git verb near the branch name trips it | Split the command, or write the file with an editor tool instead of a heredoc. The hook cannot tell a command from a sentence about a command                     |
| A human's commit contains files they did not stage       | An agent left work staged in the index; `git add <path>` then `git commit` picks up everything already staged                                        | `git reset --soft`, restage deliberately. Check `git status` before committing in a tree an agent has been working in                                             |
| A path argument turns into `C:/Program Files/...`        | Git Bash rewrites leading-slash arguments                                                                                                            | Pass base values slashless (`sdlc-preview`), or set `MSYS_NO_PATHCONV=1`                                                                                          |
| The site builds but the footer is empty                  | `build-info.json` was written to the wrong path; the import is deliberately tolerant so the build stays green                                        | Check `site/src/generated/build-info.json` exists. The tolerance and the silent failure are the same mechanism from two sides                                     |

**The general rule:** printing the right output is not the same as succeeding. Several failures
in this repository were green while broken, and the quiet ones cost the most. Never read `$?`
after a pipe, and check elapsed time whenever a hang is possible.

## What costs money

CI agent runs bill the same weekly Claude Pro quota as the terminal. Three workflows can spend
quota — `claude.yml`, `claude-code-review.yml`, `agent-intent.yml` — and only the first two
can be started without a person doing something deliberate.

- A working review is the most expensive thing here, around $3.75. A silent one is about
  $0.15, and one has run for three minutes and still posted nothing.
- **The review no longer fires on its own.** 58 runs produced 2 comments and none at all on
  the last fifteen pull requests, so it is `workflow_dispatch` now. Run it when you want it:
  `gh workflow run "Claude Code Review" -f pr=<n>`.
- **The iteration loop is free end to end.** Drafts run the checks, the build and the preview
  and nothing else; marking one ready and merging it now spends nothing either. That was not
  true while the review fired on `ready_for_review`, because a draft cannot be merged without
  being marked ready — so every merge ended with a mandatory agent run.
- Never add `--max-turns` as a cost control. It stops work halfway and charges full price for
  nothing. `timeout-minutes` is the correct bound.

## Things people ask

**"What stops it merging its own work?"** `CODEOWNERS` plus a branch rule — the agent's pull
requests are authored by `claude[bot]`, so a named human has to approve. Admit the limit: an
admin can bypass, and every bypass is logged. Note also that nothing in configuration currently
stops the agent running a merge command; that gap is intent 0050.

**"Could a malicious issue make it do something bad?"** Contained, not prevented. The drafting
agent triggers on _labelled_, not _opened_; the prompt states the issue body is data and not
instructions; and the output lands in a pull request a human approves.

**"Does this work in Cursor?"** The artifact chain ports perfectly — it is markdown in a
repository. Hooks port worst, and hooks are where the deterministic governance lives.

**"Is the automatic review any good?"** When it wins its race, yes — seven findings in one run,
two of which would have broken things. Most of the time it says nothing. Both halves are true
and the second one matters more.
