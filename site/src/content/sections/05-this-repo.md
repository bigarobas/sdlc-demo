---
slug: this-repo
title: How this site is actually built
stage: implementation
---

Nothing here is illustrative. These files exist, and the page you are reading was deployed by
the workflow described below.

```
.claude/
  skills/{intent,spec,ship,house-style,sdlc}/SKILL.md  knowledge applied as constraints
  agents/{verifier,simplifier}.md                      scoped helpers, own context
  hooks/*.mjs                                          five deterministic gates
  settings.json                                        wires them (agent cannot edit this)
docs/sdlc/
  0000-bootstrap/{intent,spec,plan}.md                 this project's own artifact chain
  0001-build-provenance/{intent,spec,plan}.md          shipped: the footer says what it is
  0002-navigation-usability/{intent,spec,plan}.md      shipped: section nav and scrollspy
  REVIEW.md                                            review policy and severities
  audit-log.md                                         hook-written, local only — see below
evals/run.mjs                                          structural assertions, zero tokens
bands.yaml                                             what "healthy" means, in numbers
.github/workflows/
  checks.yml               format, evals, diagram drift — everything   free
  verify.yml               build and link check, app changes only      free
  preview.yml              every PR gets a live URL                    free
  deploy.yml               gated FTP release to rashid.fr/sdlc/        free
  bands.yml                cron; a breach opens an issue               free
  security.yml             npm audit; the agentic half is a stub       free
  digest.yml               Monday: what is in flight, to Slack         free
  claude.yml               @claude mentions                            agent
  claude-code-review.yml   reviews pull requests                       agent
  agent-intent.yml         issue labelled -> drafts an intent          agent
```

Seven of the ten workflows spend no tokens at all. That is deliberate: the stages that must
never fail for quota reasons are the stages that do not consume quota.

The first two are a pair, and the split is worth a sentence. `checks.yml` runs on every
change and builds nothing — four seconds of formatting, evals and diagram drift. `verify.yml`
builds the site and fires only on paths that could change the built output. Editing a spec
should not deploy a website.

**One correction, because it is the kind of detail that quietly turns a claim into a lie.**
The audit log was originally committed, as an artifact you could browse here. It is not any
more. A hook appends to it on every agent write, which leaves the working tree permanently
dirty and makes `git checkout` refuse to switch branches — three sessions lost time to that
before the cost was obvious. Git's `union` merge driver fixed the merge conflicts but not the
dirty tree, so the file is now local only.

The log still exists, and it is still the live record of what the agent touched. It just
isn't in the repository, so this page no longer says that it is.
