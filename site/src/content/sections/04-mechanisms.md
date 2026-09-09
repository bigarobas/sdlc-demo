---
slug: mechanisms
title: Four mechanisms worth understanding
stage: how
---

### Skills — knowledge that applies itself

A skill is a markdown file in `.claude/skills/<name>/SKILL.md` that the agent loads when it
becomes relevant. The difference from a prompt you paste is that a skill is versioned,
reviewed, and applied without anyone remembering to apply it.

This repository has four: `intent`, `spec` and `ship` hold the artifact templates and the
questions each stage has to answer. `house-style` holds the design and prose constraints for
this site — including a rule about asset paths that exists because that exact bug shipped once.

### Hooks — the deterministic layer

A hook is a script that runs before or after a tool call and can refuse it. The model is
probabilistic; the hook is not. That distinction is the whole reason to have both.

Five hooks run here, written in Node so the same file works on a Windows laptop and a Linux
runner. The one that matters most refuses to let the agent edit its own guardrails.

### Subagents — separate contexts for separate jobs

A subagent has its own context window. The `verifier` runs the checks and reports a verdict,
so four hundred lines of build output never enter the session doing the implementation. The
`simplifier` makes a reduction pass before a pull request.

### Verification loops — one command

`npm run verify` builds the site, serves it at its real base path, crawls every link, and runs
the evals. An agent that can check its own work needs one obvious way to do it, and a reviewer
needs one thing to trust.
