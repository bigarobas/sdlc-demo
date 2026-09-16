# Plan 0050 — Write the permission boundary down

Implements [spec.md](./spec.md), from [intent.md](./intent.md).

## What planning found

The spec said _verify before believing_ about one assumption. Taking that seriously turned up
a second thing, which is now **D9** in the spec:

`protect-guardrails.mjs` matched `^\.claude\/settings\.json$` — an exact filename. So
`.claude/settings.local.json` was writable, and **local settings take precedence over project
settings**. An agent that wrote that one file could grant itself everything the deny list
refuses, while the deny list sat there looking enforced.

Without D9, every other decision in this spec is decorative. It is now the first thing
installed rather than the last.

## Files

| File                                       | Lane     | Change                                                |
| ------------------------------------------ | -------- | ----------------------------------------------------- |
| `.claude/hooks/protect-guardrails.mjs`     | proposal | widen the settings pattern to `settings*.json` (D9)   |
| `.claude/settings.json`                    | proposal | add the `permissions` block (D1, D2, D3, D6, D7)      |
| `.claude/hooks/guard-bash.mjs`             | proposal | add the `gh api` write-method pattern (D4)            |
| `.claude/skills/sdlc/SKILL.md`             | agent    | rewrite the "never merge" rule (D5)                   |
| `site/src/content/sections/06-governance.md` | agent  | add the control, and what it does not cover (D8)      |
| `evals/run.mjs`                            | agent    | D9 assertions; the D4 ones are merged and inert       |

Three guardrail files. All three are already drafted under `proposals/` and all three were
tested against the hook interface before being proposed — nineteen cases in total, listed
below.

## Order of work

**The order is the risk control.** D9 first, because everything after it depends on the
settings file being unwritable.

1. **Install D9 alone.** `protect-guardrails.mjs` only. Prove: a write to
   `.claude/settings.local.json` is denied, `.claude/settings.json` still denied, and
   `.claude/skills/**` still writable. Ten cases, already passing against the proposal.
2. **Add the D9 evals**, so the widened pattern cannot narrow again by accident.
3. **Install `settings.json` and `guard-bash.mjs` together**, then run the proof below
   immediately. These two are one decision — the deny list and the pattern that stops it being
   bypassed — and installing either alone leaves a known gap open.
4. **Prove the central assumption.** See below. If it fails, revert step 3 and stop.
5. **The skill and section 06.** Prose, no risk, after the mechanism is known to work.
6. `npm run diagram`, because a hook change moves it. `npm run verify`.

Steps 1 and 3 need a human — `npm run proposals -- --install` is something the operator runs,
not the agent.

## Proving the central assumption

The spec's largest risk: **the whole design assumes an allowlist entry cannot override a hook
denial.** If it can, this makes the repository weaker while appearing to strengthen it.

This cannot be tested before installing, because `permissions` only takes effect once
`settings.json` is in place. So the plan is: install, test first thing, revert if wrong. That
is only acceptable because the intent made _reversible in one commit_ a constraint, and it is.

The test, in order, immediately after step 3:

| Attempt                                     | Expected                            | What a different result means             |
| ------------------------------------------- | ----------------------------------- | ----------------------------------------- |
| a write to the repository's default branch  | denied by `guard-bash.mjs`          | **allow overrides deny — revert at once** |
| `gh pr merge` on any pull request           | denied by the deny list             | the deny list is not being read           |
| `gh api -X PUT .../merge`                   | denied by `guard-bash.mjs`          | D4's pattern is not matching              |
| `gh api repos/o/r/rulesets`                 | prompts, then succeeds              | D3 has accidentally denied reads          |
| `git status`, `git diff`, `npm run check`   | run with no prompt                  | the allowlist is not being read           |

The first row is the one that matters. The others confirm the change did what it says; that
one confirms it did not undo something.

Revert is `git revert` of the install commit plus `npm run diagram`. One commit, as promised.

## Risks, and what this plan does about them

| Risk                                                                                              | What the plan does                                                                                                                                               |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Allow overrides deny**, and the install weakens the repository.                                 | Step 4, first row, run immediately after step 3 — before any other work and before the session moves on. Revert is one commit.                                    |
| **Installing `settings.json` before D9** would mean the deny list is bypassable from the moment it exists. | D9 is step 1, on its own, with its own proof.                                                                                                                    |
| **Another settings variant exists** that neither pattern covers.                                  | D9's pattern is `settings(\.[A-Za-z0-9-]+)*\.json`, tested against `settings.json`, `settings.local.json` and `settings.dev.local.json`. A variant outside that shape would still get through, and the honest answer is the same as the spec's: this stops drift, not a determined agent. |
| **The install forgets `npm run diagram`** and turns `main` red, as it did on 2026-09-15.          | Step 6, and `npm run proposals -- --install` prints the reminder itself now.                                                                                      |
| **A prompt storm** if the allowlist is read but too narrow.                                       | Step 4's last row. If ordinary commands still prompt, the allowlist is not being applied and that is a different bug from the one being tested.                   |

## How completion is proven

- A write to `.claude/settings.local.json` is denied.
- Asking the agent to merge a pull request fails as a **refused tool call**, not a polite
  decline. This is the outcome sentence from the intent.
- A write to the default branch is still denied with the allowlist installed.
- `gh api` denied with a write method in either flag position, allowed for reads.
- `npm run check` reports **34 passing** for the D4 assertions becoming live, plus the new D9
  ones.
- Section 06 says both what is now enforced and that approving a deployment is not.

## Cost

No tokens beyond one implementation cycle. No new CI job, no credential, no dependency. Every
assertion added is structural and free.
