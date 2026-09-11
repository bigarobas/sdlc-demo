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
| Intent agent, no tools granted     | "succeeded", did nothing           | ~$0.08    |
| Intent agent, tools granted        | wrote the artifact, opened a PR    | ~$0.19    |
| Control-band check → issue → Slack | full monitoring loop               | **$0.00** |

Two thirds of that day's agent spend bought nothing, and all of it went on a single
misconfigured cost control. The most expensive thing in this repository is a review; the
cheapest is the part that closes the loop.

## What that bought, in decisions

- **Three agent workflows, no more.** Each has a `timeout-minutes` and a `concurrency` group.
  None has a turn limit any more, for the reason above. The review does not trigger on
  `synchronize`, because that would start a fresh run on every push to a branch.
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
