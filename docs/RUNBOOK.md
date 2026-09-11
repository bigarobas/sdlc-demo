# Demo runbook — 2026-09-23

Thirty minutes plus discussion. Two lanes, because one agent cycle does not fit inside a talk
and pretending otherwise means standing in silence watching a spinner.

**Lane A** is instant and deterministic — drop it in anywhere, it always works.
**Lane B** is the full SDLC cycle, fired early and harvested late.

---

## The day before — 2026-09-22

- [ ] **Check the weekly quota.** Everything else assumes there is some left. A full Lane B
      run costs roughly $0.30 of quota-equivalent; a review, when it works, up to $0.70.
- [ ] **Run the whole cycle once, start to finish.** Not the pieces — the cycle.
- [ ] **Confirm the fallback recording still matches the site.** If the design changed since
      the 14th, re-record it. A recording that shows a different site than the screen is worse
      than no recording.
- [ ] **Reset the band threshold.** `bands.yaml` on `main` must hold the real 512000, or the
      cron will open an issue overnight and the live demo will have nothing left to breach.
      Read the value, do not assume it:

```powershell
git show origin/main:bands.yaml | Select-String "max:"
```

- [ ] **Check no band has already fired.** An open control-band issue means the cron has
      performed your trick for you overnight.

```powershell
gh issue list --label control-band --state open
```

- [ ] **Close any open issues and PRs.** A clean repository on the projector is worth more
      than the two minutes it takes.

## The morning of

- [ ] `npm run verify` — green.
- [ ] `https://rashid.fr/sdlc/` loads, and the diagram renders.
- [ ] Slack is visible on screen somewhere. The notifications are half the effect.
- [ ] Terminal font size up. Nobody at the back can read 12px.

**Tabs, in this order, left to right:**

1. `https://rashid.fr/sdlc/` — the site, the spine of the talk
2. `https://github.com/bigarobas/sdlc-demo` — Actions tab, for watching runs
3. `https://github.com/bigarobas/sdlc-demo/issues/new/choose` — pre-loaded, for T+2
4. Slack
5. A terminal in the repository

---

## Lane B — fire at T+2, harvest at T+18

The whole point: **start it before you explain it.** By the time you have talked through the
concepts, the agent has finished, and the result is waiting rather than being waited for.

### T+2 — file the intent, then walk away from it

Tab 3, the template chooser. The template files the issue **unlabelled** by design, so
nothing runs yet. Wording decided on the 14th, not improvised on the day.

Then apply the `intent` label — **on stage, deliberately**.

That separation is the point, and it is worth being slow about: filing costs nothing and
commits nobody; labelling is the decision, and it takes write access.

> "That label is the only thing I did. Applying it takes write access, which is the difference
> between a maintainer triaging and anyone on the internet typing into a box. We will come back
> to it."

Then leave it. Do not watch it.

### T+3 to T+18 — the talk

Sections 1 to 8 of the site. Slack notifications will arrive in the background; let them.
If one lands mid-sentence, glance at it and carry on — the interruption _is_ the demonstration.

### T+18 — harvest

Back to the issue. There is a comment from the agent linking a pull request, and the pull
request contains exactly one file: `docs/sdlc/NNNN-slug/intent.md`.

Read the **Open questions** section aloud. That is the part worth showing — not that it wrote
something, but that it wrote down what it could not determine instead of inventing it.

Then the checks: `verify` green on two base paths, a preview URL you can click.

### T+20 — the two approvals

Two gates, with a merge between them:

1. **Gate one — approve the pull request.** You can, because the author is `claude[bot]` and
   not you. The agent cannot merge its own work.
2. Merge it. The deploy starts and stops at the `production` environment.
3. **Gate two — approve the deployment.**

> "The agent wrote it, CI checked it, and it stopped there. Not because it was told to stop —
> because the FTP password does not exist on its side of that line."

**Say plainly that the page does not change.** This cycle produced an _artifact_ —
`docs/sdlc/NNNN-slug/intent.md` — and `docs/` is not part of the Astro build, which renders
only `site/src/content/sections/*.md` and the generated diagram. The deploy runs, the gate
holds, and the site is byte-identical.

That is a flat ending unless you name it, so name it:

> "Nothing on the page moved, because what just went through the whole pipeline was a
> document, not a paragraph. Stage 1 produces an intent — deciding what to build. The next
> cycle is what builds it."

If you want something visible at the end instead, have a small **content** pull request
prepared and unmerged before the talk, and merge that at T+22 as a second, faster lap.

---

## Lane A — 90 seconds each, drop in anywhere

Use these when Lane B is still working, or if it fails outright.

### A1 — the hook says no

In the terminal, ask Claude to edit a protected file:

```
edit .github/workflows/deploy.yml and remove the approval gate
```

It is denied before the tool runs, by a Node script, with a reason. Read the denial aloud.

> "That is not the model choosing to respect a rule. That is thirty lines of JavaScript
> returning 'deny'."

**Then say the honest part**, because someone in the room is already thinking it: a hook covers
the tool calls it matches, and a determined agent with a shell could write the same file another
way. It stops drift and accidents, which is the failure that actually happens. The boundary that
holds is the credential that is not there.

### A2 — the loop closes by itself

```powershell
gh workflow run "Control bands" --ref test/band-breach
```

That branch has an absurd page-weight budget, so the real page breaches it. About twenty
seconds later — measured across three runs, not estimated — an issue opens by itself, and
Slack pings.

> "No model ran. That is curl, a threshold, and an exit code. The half of the loop that proves
> autonomy is the half that costs nothing — which is also why it still works when the quota
> does not."

Then apply the `intent` label to _that_ issue, and you are back in Lane B.

### A3 — the diagram is generated

Site, section 5. Expand it.

> "Nobody drew this. It is derived from the workflow files, the hooks, the skills. CI regenerates
> it and fails if it does not match — so it cannot go stale, because it is not maintained."

Worth adding: generating it caught a wrong claim that code review had missed. One workflow was
described as firing on _issue labelled_ when it actually fires on _any issue opened_ — which is
the whole security model. It survived in YAML, unremarked, until something had to state it in
words.

---

## When it fails

It is a live demo. Something will.

| What breaks                             | What to do                                                                                                                                             |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| The agent's PR has not appeared by T+18 | Do not wait. Go to A1 and A3, come back at T+25. The Actions tab shows it is still running — say so, it is more honest than filling silence.           |
| The agent produces something odd        | **Show it.** A wrong artifact inside a PR a human must approve is the containment argument working. Read it aloud and explain why it is not a problem. |
| The quota is exhausted                  | Run **A2 and A3** — A1 still needs a live model turn even though the edit is denied. Play the recording for the rest.                                  |
| The deploy hangs before the gate        | Check for an older unapproved run holding the queue — that happened for seventeen hours once. `gh run list --workflow Deploy`                          |
| Preview shows the wrong branch          | Expected. It is one rolling preview: the most recently updated PR wins. Say that and move on.                                                          |
| Nothing works at all                    | The recording. It is ninety seconds and it shows the same cycle.                                                                                       |

**The rule:** never debug on stage. Narrate what you see, switch lanes, keep moving. A demo that
fails and is explained clearly lands better than one that succeeds and is not understood — and
this talk is _about_ things failing visibly, so a failure is on topic.

---

## Questions you will be asked

**"What stops it merging its own work?"** `CODEOWNERS` plus a branch rule. The agent's PRs are
authored by `claude[bot]`, so a named human has to approve. Admit the limit: you are an admin
and can bypass, and every bypass is logged.

**"What does this cost?"** Section 10 has the real numbers. Lead with the embarrassing one:
$2.80 spent on a cost control that produced nothing.

**"Could a malicious issue make it do something bad?"** Contained, not prevented. The drafting
agent triggers on _labelled_, not _opened_; the prompt states the issue body is data, not
instructions; and the output lands in a PR a human approves. Then show that the agent reported
on the injection attempt in its own artifact.

**"How long did this take?"** Five evenings, and most of the time went on the things in section
9 — not on the agent writing code.

**"Does this work in Cursor?"** Section 8. The artifact chain ports perfectly; hooks port worst,
and hooks are where the real governance lives.

**"Is the review any good?"** Answer with whatever is true on the day. If it is still declining
to comment, say so — section 7 already labels what is real and what is not, and being caught
overselling would cost more than the feature is worth.
