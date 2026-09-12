---
slug: cost
title: What it costs
stage: economics
---

This runs on a Claude Pro subscription with no API billing. CI authenticates with an OAuth
token from `claude setup-token`, which means **agent runs in CI bill the same weekly quota as
the terminal**. That single fact drove most of the architecture.

## Measured, on one real day of building

| Run                                | Result                             | Cost      |
| ---------------------------------- | ---------------------------------- | --------- |
| PR review, `--max-turns 8`         | stopped mid-review, posted nothing | ~$1.81    |
| PR review, `--max-turns 25`        | stopped mid-review, posted nothing | ~$0.99    |
| PR review, no turn limit           | completed, 17 turns, 2m17s         | ~$0.67    |
| PR review, full run                | 35 turns, 9m11s, seven findings    | ~$3.75    |
| PR review, lost its own race       | 6 turns, posted nothing            | ~$0.15    |
| Intent agent, no tools granted     | "succeeded", did nothing           | ~$0.08    |
| Intent agent, tools granted        | wrote the artifact, opened a PR    | ~$0.19    |
| Control-band check → issue → Slack | full monitoring loop               | **$0.00** |

Three of those eight rows bought nothing at all — $3.03 of the total, and only $2.80 of it on
the misconfigured cost control. The other two were a run that lost its own race and an agent
that was never given the tools to do the thing it was asked to do. The most expensive item
here is a review that works: roughly twenty-five times the cost of one that silently does not,
and twenty times the cost of the intent agent actually drafting an artifact. The cheapest is
the part that closes the loop, which costs nothing because nothing in it is a model.

## What that bought, in decisions

- **Three agent workflows, no more.** Each has a `timeout-minutes` and a `concurrency` group.
  The review has no turn limit any more, for the reason above; `claude.yml` still carries
  `--max-turns 20` and probably should not, which is the sort of thing that survives because
  nothing red ever happens to it. The review does not trigger on `synchronize`, because that
  would start a fresh run on every push to a branch.
- **Stages 4 and 6 spend nothing.** Build, link check, evals, formatting, the diagram drift
  check and control-band monitoring are all deterministic. The stages that must not fail
  during a demo are the stages that cannot fail for quota reasons.
- **The eval suite is structural, not judged.** Zero tokens, run on every push. See the
  honesty section for what that leaves out.
- **`AGENTS.md` is kept short deliberately** — it is re-read on every single run.
- **Draft pull requests are free.** The review skips drafts, so iterating costs nothing until
  the work is marked ready.

## The failure mode that matters

An uncapped agent workflow left running overnight is not a surprise bill on this plan. It is a
demo that cannot run the next morning — and that is worse, because a bill can be paid.
