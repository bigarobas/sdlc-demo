---
slug: cost
title: What it costs
stage: economics
---

This runs on a Claude Pro subscription, with no API billing. CI authenticates with an OAuth
token from `claude setup-token`, which means **agent runs in CI bill the same weekly quota as
the terminal**. That single fact drove most of the architecture.

The consequences, in order of how much they shaped things:

- **Only three agent workflows exist**, and each is capped with `--max-turns`,
  `timeout-minutes` and a `concurrency` group. The review workflow does not trigger on
  `synchronize`, because that would start a fresh run on every push to a branch.
- **Stages 4 and 6 spend nothing.** Build, link check, evals, formatting and control-band
  monitoring are all deterministic. The stages that must not fail during a demo are the stages
  that cannot fail for quota reasons.
- **The eval suite is structural, not judged.** See the honesty section.
- `AGENTS.md` is kept short deliberately — it is re-read on every single run.

An uncapped review workflow left running overnight is not a surprise bill on this plan. It is a
demo that cannot run the next morning, which is worse.
