@AGENTS.md

## Claude-specific

The instructions above are shared with Cursor and Codex. This file adds only what is
Claude Code specific, so that a colleague reproducing this repo in another tool loses
tooling, not knowledge.

- **Skills** in `.claude/skills/` carry the stage templates: `/intent`, `/spec`, `/ship`,
  and `house-style`. Invoke the stage skill rather than improvising the artifact format.
- **Subagents** in `.claude/agents/`: use `verifier` to run `npm run verify` so build noise
  stays out of this context, and `simplifier` for a reduction pass before opening a PR.
- **Plan mode** produces `plan.md`. Write it to `docs/sdlc/NNNN-slug/plan.md` and commit it
  with the work, so the plan is reviewable next to the diff it produced.
- **Hooks** are configured in `.claude/settings.json` and implemented as Node scripts in
  `.claude/hooks/`. Their denials are final (see Guardrails above).
