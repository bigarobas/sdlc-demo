---
slug: portability
title: Doing this in Cursor instead
stage: portability
---

Little here is Claude-specific in principle, though the tooling differs. The instructions live
in `AGENTS.md`, which Cursor and Codex read natively; `CLAUDE.md` is one line importing it. One
source of truth, no duplication.

| Concept      | Claude Code                     | Cursor                                |
| ------------ | ------------------------------- | ------------------------------------- |
| Instructions | `CLAUDE.md` → `@AGENTS.md`      | `AGENTS.md`, `.cursor/rules/*.mdc`    |
| Skills       | `.claude/skills/*/SKILL.md`     | rules with `description` + globs      |
| Subagents    | `.claude/agents/*.md`           | background agents                     |
| Hooks        | `.claude/settings.json`         | Cursor hooks                          |
| CI agent     | `anthropics/claude-code-action` | background agents, or your own runner |

The row that ports worst is hooks, and that is worth saying plainly: **the deterministic layer
is where the ecosystems differ most**, and it is also the layer doing the real governance work.
Everything above it is prompting with extra steps.

The artifact chain ports perfectly, because it is just markdown files in a repository. If you
take one thing from this to another tool, take that.
