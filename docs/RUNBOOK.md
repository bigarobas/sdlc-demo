# Runbook

How to run this repository, and what to do when it misbehaves. For the talk script, see
[TALK.md](./TALK.md) — that document has a date on it and this one does not.

## The loop, end to end

1. **Open an issue** describing the problem. Not the solution.
2. **Apply the `intent` label.** This is the trigger, and it is also a control: applying a
   label needs write access, so the drafting agent only ever runs on something a maintainer
   decided to process.
3. `agent-intent.yml` **drafts `intent.md`** and opens a pull request. The directory is named
   after the issue number — `docs/sdlc/0046-repo-tree-visualization/` is issue #46.
4. **Edit that file on the branch** before merging: Files changed → pencil → commit to branch.
   Two things in one edit — answer the open questions inline, and set
   `- **Status:** accepted`.
   - Answering in a pull request comment does not count. An eval fails the build if an intent
     is accepted with no spec and its questions still unanswered.
5. **Merge**, then `git checkout main` and `git pull`.
6. **`/sdlc <id>`** for the spec. Again for the plan. Again for the implementation. Each is
   its own short-lived pull request onto `main`.
   - `/sdlc <id> --auto` collapses those three into one pull request. Use it when the design
     space is small and a mistake is cheap; not when the spec contains real choices.
7. **Merge the implementation.** If it touched `site/`, the deploy parks at the production
   gate and Slack says so. Approve it.

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
| A review run completes and posts nothing                 | The action spawns background subagents, yields, and the session ends. A race, not a policy                                                           | Roughly one run in five posts. Ask by hand with a `@claude review this PR` comment — that works every time. Durations have ranged 12s to 534s with no pattern     |
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

CI agent runs bill the same weekly Claude Pro quota as the terminal. Three workflows spend
quota — `claude.yml`, `claude-code-review.yml`, `agent-intent.yml`. The other seven cost
nothing, which is deliberate: the stages that must not fail for quota reasons are the ones
that do not consume it.

- A working review is the most expensive thing here, around $3.75. A silent one is about
  $0.15, and one has run for three minutes and still posted nothing.
- Draft pull requests are free — the review skips drafts. Open artifact-only pull requests as
  drafts; there is no value in paying a model to read one markdown file.
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
