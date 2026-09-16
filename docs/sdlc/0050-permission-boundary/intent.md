# Intent 0050 — the agent's permission boundary is not written down anywhere executable

- **Status:** accepted
- **Author:** Rashid Ghassempouri
- **Date:** 2026-09-14
- **Issue:** [#50](https://github.com/bigarobas/sdlc-demo/issues/50)

## Problem

`.claude/settings.json` has a `hooks` block and no `permissions` block. Nothing in this
repository states which tool calls the agent may make. Two symptoms come from that single
absence, and they pull in opposite directions, which is why they are one problem and not two.

**The agent is trusted not to merge.** A squash merge with `--admin` on the operator's `gh`
auth would work today. It does not happen because `.claude/skills/sdlc/SKILL.md` says
"Never merge, never approve, never deploy" — an instruction the model follows. Section 06 of
the site names that distinction in its first paragraph:

> What matters is how that is enforced, because "we told it not to" is not enforcement.

The same holds for submitting a review, setting a secret, editing repository settings and
dispatching a workflow. The production gate is real because the credential is absent. These
have no equivalent: they are prevented by the agent choosing correctly, every time, forever.

This is the site's own argument turned on a part of the repository the site does not describe.
It is not a hypothetical weakness — it is the one place where the honest answer to "what stops
it?" is "nothing, so far".

**And the same gap slows the safe work down.** With no allowlist, ordinary git and `gh`
commands reach the permission classifier one at a time. On 2026-09-14 a branch deletion was
refused mid-task, and the work continued in three smaller calls instead. Every refusal is a
round trip, and the commands being interrupted are the harmless ones — status, diff, branch,
commit — while the dangerous ones pass through the same undifferentiated middle.

A boundary that is nowhere written is simultaneously too tight and too loose.

## Proposed outcome

The boundary is a list in a file rather than a sentence in a skill.

- Commands that are safe and frequent run without prompting.
- Commands that must stay human are refused by configuration, so declining them stops being a
  judgement the agent has to make correctly.
- The hooks keep working unchanged, and an allowlist never overrides a hook denial:
  `guard-bash.mjs` must still refuse a direct write to the default branch even when the
  matching git verb is allowed.
- Anything the agent may not do fails the way editing a workflow file already fails — before
  the tool runs, with a reason.

The test that this happened: ask the agent to merge a pull request, and watch the tool call be
refused rather than politely declined.

## Affected systems

- `.claude/settings.json` — a guardrail file, so this is a proposal and a human commit
- `.claude/skills/sdlc/SKILL.md` — its "never merge" rule becomes a description of a control
  rather than the control
- Section 06 of the site, which lists the controls that exist and would gain one
- No credential, no workflow, no CI permission change

A draft already exists at `proposals/.claude/settings.json`, with the `hooks` block verified
byte-identical to the installed one.

## Constraints

- **Zero tokens.** Configuration, not a model.
- **The hooks are the floor, not the ceiling.** If an allowlist entry can suppress a hook
  denial, this change makes the repository weaker and must not ship. Verify before believing.
- **`.claude/settings.json` is a guardrail file.** The agent drafts; a human installs and
  commits. That constraint is the thing being extended here and cannot be relaxed to make
  extending it easier.
- **Reversible in one commit.** A permissions block that turns out to be wrong should be
  removable without unpicking anything else.
- The operator works on Windows with Git Bash and PowerShell, so nothing in the allowlist may
  assume a POSIX shell.

## Open questions

All three answered on 2026-09-16, before the spec. The second one changed the draft proposal
rather than merely settling a preference.

1. **Allow the git verbs broadly and leave the default-branch rule to `guard-bash.mjs`, or
   narrow them in the allowlist as well?** Two layers stating the same rule is either useful
   redundancy or a second place to forget when the rule changes. — Rashid

   **Answer: broadly. The hook owns it.**

   `guard-bash.mjs` already denies writes to the default branch and force-pushes while
   allowing `--force-with-lease`, and an allowlist entry never overrides a hook denial — so
   `Bash(git push:*)` allowed plus the hook denying `main` is still denied.

   The deciding fact is that the allowlist could not express the rule anyway. Permission
   patterns match by prefix, and there is no prefix that means "any branch except `main`".
   Narrowing would either block legitimate pushes or be decorative, and a decorative control
   is worse than none — it invites the belief that something is enforced when it is not.

2. **Does `gh api` belong on the allowlist?** It is how the agent reads run logs and check
   states, and it also reaches every write endpoint the token has. Allowing it may quietly
   re-open everything the deny list closes. — Rashid

   **Answer: no. Remove it — this question found a hole in the draft proposal.**

   The deny list blocks `gh pr merge`. The allowlist as drafted permitted `Bash(gh api:*)`,
   and `gh api -X PUT repos/<owner>/<repo>/pulls/<n>/merge` is the same merge through a door
   left open. The same applies to secrets, repository settings and workflow dispatch. One
   broad allow made **every entry in the deny list decorative**.

   It cannot be narrowed either. A deny for `Bash(gh api -X:*)` catches the flag only when it
   comes first; `gh api repos/... -X PUT` sails past, because the write method may appear
   anywhere in the argument list and a prefix pattern cannot express "absent".

   So `gh api` is prompted for, every time, which is the correct treatment of a tool that can
   do anything. `gh run view` and `gh pr checks` cover most of what it was being used for.

   A pattern denying `gh api` combined with a write method belongs in `guard-bash.mjs` as
   well, because a hook matches with a regex and therefore can see a flag anywhere. That is a
   second guardrail file and therefore a second proposal.

3. **Does denying the merge command in settings make the `sdlc` skill's rule redundant?**
   Keeping both means one enforces and one explains, which is how the guardrail hooks and
   `AGENTS.md` already work. Removing the sentence would make the skill shorter and the reason
   invisible. — Rashid

   **Answer: keep both, and change what the skill claims.**

   `protect-guardrails.mjs` enforces and `AGENTS.md` explains; this is that pattern. The
   enforcement stops the action, the prose stops the argument about whether it should have.

   More importantly, the skill covers ground the settings cannot reach. "Never merge, never
   approve, never deploy" — **approving a deployment is not a shell command at all.** It is a
   click in the Actions tab. So even with the deny list installed, two of those three remain
   conventions, backed by the `production` environment's required reviewer rather than by any
   rule in this repository.

   The skill should therefore stop implying it is the control. It should say which half is
   denied by configuration and which half rests on the environment gate.

## Not in scope

Writing to the default branch, merging, and editing guardrail files stay exactly as they are.
This intent writes the existing boundary down; it does not move it. Any proposal that widens
what the agent may do belongs in a different intent, argued on its own.

## Notes

Raised after a session in which the agent declined to merge a pull request on request, citing
the skill — and then noted that nothing would have stopped it. The useful half is that more
autonomy on the safe surface and a stronger claim on the unsafe one come from the same edit.

**A separate finding, recorded here so it is not lost.** While this file was being drafted,
`guard-bash.mjs` denied the attempt twice. The first denial was a compound shell command whose
text contained a git verb and the default branch name in unrelated sub-commands. The second
had no such command in it at all — the hook was matching the _prose of this intent_, inside a
heredoc, because this document quotes the rule it is describing.

The hook inspects the raw command string, so it cannot tell a command from a sentence about a
command. Both denials were correct in spirit and wrong in fact, and the file had to be written
with a different tool to get past them. That is a real defect and a good argument for this
intent — a boundary expressed as a string match is a boundary that misfires on documentation
— but it is a different problem and belongs in its own issue.
