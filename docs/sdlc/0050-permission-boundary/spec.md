# Spec 0050 — Write the permission boundary down

Implements [intent.md](./intent.md).

Three of the decisions below are the intent's own answered questions, restated as numbered
rows so later work can cite them. The rest are what those answers left open.

## 1. Guiding decisions

| #   | Decision | Why, and where it comes from |
| --- | --- | --- |
| D1 | `.claude/settings.json` gains a `permissions` block with `allow` and `deny`. The `hooks` block is byte-identical to what is installed. | _From the outcome:_ "the boundary is a list in a file rather than a sentence in a skill". Touching `hooks` in the same change would make the diff impossible to review for the thing it is actually doing. |
| D2 | The git verbs are allowed **broadly**; the default-branch rule stays in `guard-bash.mjs` alone. | _Answer 1._ An allowlist entry never overrides a hook denial, and prefix patterns cannot express "any branch except the default one". A control that cannot state its own rule invites belief in enforcement that is not there. |
| D3 | **`gh api` is on neither list.** It prompts, every time. | _Answer 2,_ which found a hole in the draft: `gh api -X PUT .../pulls/N/merge` is the denied merge through an unwatched door, and the write method can sit anywhere in the argument list, so no prefix rule catches both orderings. |
| D4 | `guard-bash.mjs` gains one pattern: `gh api` combined with a write method. | Same answer, other half. A hook matches with a regex and sees a flag wherever it appears — which is exactly the thing `settings.json` cannot do. This is the deterministic layer covering the declarative one's blind spot. |
| D5 | The `sdlc` skill keeps its rule and changes what it claims. | _Answer 3._ Merging becomes denied by configuration; **approving a deployment is a click in the Actions tab** and no shell rule reaches it. The skill must say which half is enforced and which rests on the `production` environment. |
| D6 | The deny list names commands, not capabilities. | `gh pr merge`, `gh pr review`, `gh secret`, `gh variable`, `gh repo edit`, `gh repo delete`, `gh workflow run`, and the two branch-deletion forms. A deny list that tried to describe intent rather than syntax would be a policy engine, and this is a list of strings. D3 is the honest admission of that limit. |
| D7 | Nothing is added to `allow` that the agent has not actually needed. | The list is 37 entries drawn from commands run during real work, not from imagining what might be useful. Every entry is a thing that was prompted for at least once. |
| D8 | Section 06 of the site gains the control, and says what it does not cover. | The section currently lists `CODEOWNERS`, fork guards and the credential gate. It would be worse than useless to add "and the agent cannot merge" without also saying that approving a deployment is still a convention. |

## 2. Design

**`proposals/.claude/settings.json`** — already written. Adds:

```json
"permissions": {
  "allow": [ /* 37 read and routine-write commands */ ],
  "deny":  [ /* 9 entries: merge, review, secrets, repo edit/delete, workflow run, branch deletion */ ]
}
```

**`proposals/.claude/hooks/guard-bash.mjs`** — already written. One new pattern beside the
existing five:

```js
/\bgh\s+api\b[^\n]*(?:-X|--method)[=\s]+(?:POST|PUT|PATCH|DELETE)\b/i;
```

**`evals/run.mjs`** — four assertions, already merged and currently inert. They are gated on
the hook containing the `gh api` pattern, so they skip until D4 is installed and then start
holding it. 30 passing now, 34 after.

**`.claude/skills/sdlc/SKILL.md`** — the "Never merge, never approve, never deploy" bullet is
rewritten per D5. Not a guardrail file; the agent edits it.

**Section 06** — one paragraph per D8.

## 3. Deliberate omissions

- **No `ask` tier.** The permission system has one, and using it would mean a third state to
  reason about for no case that currently needs it. Anything not on either list already
  prompts, which is the same outcome with fewer moving parts.
- **Approving and deploying stay unenforced here.** They are clicks, not commands. The control
  that covers them is the `production` environment's required reviewer, which already exists
  and is not part of this intent.
- **No attempt to stop a determined agent.** A shell is a shell. This stops drift and accident,
  which is the failure that actually happens, and D3 exists precisely because one broad allow
  would have made the rest decorative.

## 4. Risks

| Risk | Mitigation |
| --- | --- |
| **An allowlist entry silently overrides a hook denial.** The whole design assumes it cannot. If it can, this change makes the repository weaker while appearing to strengthen it. | The intent names this as a constraint: _verify before believing._ The plan must test it directly — allow the push verb, then attempt a write to the default branch and watch the hook refuse. Not inferred from documentation. |
| **The deny list is a string match, so a synonym defeats it.** `gh api` was one; there may be others. | D3 and D4 are the answer to the one that was found. The honest position, stated in the omissions, is that this stops drift rather than a determined agent — the same thing section 06 already says about hooks. |
| **37 allow entries is a lot to review**, and a wrong one is invisible until it matters. | D7 keeps it to commands actually used. The reviewable question per entry is "could this write something", and the answer for all 37 is either no or "only inside the repository, which git already makes recoverable". |
| **The skill and the settings could drift apart**, one saying merge is impossible while the other stops denying it. | Nothing checks this, and nothing easily could. Flagged rather than solved. It is smaller than the gap being closed. |
| **Prompting for `gh api` is friction on a common read.** | Measured trade: `gh run view` and `gh pr checks` cover most uses. If the prompting turns out to dominate, the follow-up is a narrower read-only wrapper, not a broad allow. |

## 5. How completion is proven

- Ask the agent to merge a pull request and watch the **tool call be refused**, the way editing
  a workflow file is refused — not politely declined.
- Allow the push verb, attempt a write to the default branch, and watch `guard-bash.mjs` still
  deny it. This is the D2 assumption and the largest risk; it is tested, not reasoned about.
- `gh api -X PUT ...` denied in both flag orderings; `gh api repos/o/r/rulesets` allowed.
- `npm run check` reports **34 passing**, up from 30, because the conditional evals have
  become live.
- `git status` clean after installation, with `hooks` in `settings.json` unchanged.

## 6. What this needs from a human

Both files are guardrail files. The agent drafts; a human installs and commits:

```
npm run proposals -- --install
npm run diagram
```

The second is not optional — a hook change moves the derived diagram, and omitting it turned
`main` red within a minute on 2026-09-15.
