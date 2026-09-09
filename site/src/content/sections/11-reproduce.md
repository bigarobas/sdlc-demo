---
slug: reproduce
title: Reproduce this
stage: try it
---

The repository is public: **[bigarobas/sdlc-demo](https://github.com/bigarobas/sdlc-demo)**.

The shortest useful path, roughly an evening each:

1. **Tooling.** Install the GitHub CLI and Claude Code. Run `/install-github-app` in your repo,
   choose the subscription token, and take both offered workflows. Confirm `@claude` answers a
   comment on an issue before doing anything else.
2. **A verification loop.** One command that builds and checks your project. Make it a script,
   not a chain of shell commands, or it will only work on your machine.
3. **The `.claude/` layer.** `AGENTS.md` first, then one skill and one hook. Make the hook
   refuse something, and watch it refuse.
4. **The gate.** Put your deploy credential in an environment with a required reviewer. This is
   the step that changes what the agent is allowed to be.
5. **Content.** Always longer than you think.

If you only copy one thing, copy the artifact chain — `intent.md`, `spec.md`, `plan.md` in the
repository. It needs no tooling, works in any editor, and is the part that survives when you
change agents.
