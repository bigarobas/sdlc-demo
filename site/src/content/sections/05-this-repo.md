---
slug: this-repo
title: How this site is actually built
stage: implementation
---

Nothing here is illustrative. These files exist, and the page you are reading was deployed by
the workflow described below.

```
.claude/
  skills/{intent,spec,ship,house-style}/SKILL.md   knowledge applied as constraints
  agents/{verifier,simplifier}.md                  scoped helpers, own context
  hooks/*.mjs                                      five deterministic gates
  settings.json                                    wires them (agent cannot edit this)
docs/sdlc/
  0000-bootstrap/{intent,spec,plan}.md             this project's own artifact chain
  REVIEW.md                                        review policy and severities
  audit-log.md                                     appended by a hook, one line per write
evals/run.mjs                                      18 assertions, zero tokens
bands.yaml                                         what "healthy" means, in numbers
.github/workflows/
  verify.yml       deterministic: build, links, evals, formatting     free
  preview.yml      every PR gets a live URL                           free
  deploy.yml       gated FTP release to rashid.fr/sdlc/               free
  claude.yml       @claude mentions                                   agent
  agent-review.yml review on pull requests                            agent
  bands.yml        cron; a breach opens an issue                      free
```

Three of the six workflows spend no tokens at all. That is deliberate: the stages that must
never fail for quota reasons are the stages that do not consume quota.
