# sdlc-demo

A static site explaining the AI-native SDLC, built by the SDLC it describes.

**[rashid.fr/sdlc](https://rashid.fr/sdlc/)** · [the pipeline diagram](docs/PIPELINE.md) ·
[the talk runbook](docs/RUNBOOK.md)

Everything the site claims is in this repository: the skills, the hooks, the workflows, the
artifact chain, and the audit of what broke while building it. If a claim on the page is not
backed by a file here, that is a bug.

## What is actually here

```
.claude/
  skills/       intent · spec · ship · house-style · sdlc
  agents/       verifier · simplifier
  hooks/        five Node scripts that can refuse a tool call
  settings.json wires them (an agent cannot edit this file)
docs/sdlc/      intent.md -> spec.md -> plan.md, per piece of work
docs/PIPELINE.md   the architecture, generated — CI fails if it goes stale
evals/run.mjs   structural assertions, zero tokens
bands.yaml      what "healthy" means for the live site, in numbers
.github/workflows/
  verify · preview · deploy · bands        deterministic, free
  claude · claude-code-review · agent-intent   agent, capped
```

## Running it

Node 22 is required — Astro refuses 20, and `.nvmrc` pins the version.

```bash
npm install
npm ci --prefix site
npm run verify
```

`npm run verify` is the only command that matters: it builds, serves the site at its real
base path, crawls every link, runs the evals, and fails if the generated diagram no longer
matches the code.

| Command           | What it does                                     |
| ----------------- | ------------------------------------------------ |
| `npm run verify`  | the whole check, and what CI runs                |
| `npm run dev`     | Astro dev server                                 |
| `npm run intents` | where every piece of work has got to             |
| `npm run diagram` | regenerate `docs/PIPELINE.md` and the site's SVG |

## Reproducing it somewhere else

Roughly an evening each, in this order. The order matters: each step is only worth doing once
the one before it works.

1. **Tooling.** GitHub CLI and Claude Code. `/install-github-app` in your repo, choose the
   subscription token, take both offered workflows. Confirm `@claude` answers a comment on an
   issue before building anything else.
2. **One verification command.** Make it a script, not a chain of shell commands, or it will
   only work on the machine you wrote it on.
3. **The `.claude/` layer.** `AGENTS.md` first, then one skill and one hook. Make the hook
   refuse something and watch it refuse — that is the moment the idea stops being abstract.
4. **The gate.** Put your deploy credential in a GitHub Environment with a required reviewer.
   This is the step that changes what an agent is allowed to be.
5. **Content.** Always longer than you think.

If you copy one thing, copy the artifact chain — `intent.md`, `spec.md`, `plan.md` in the
repository. It needs no tooling, works in any editor, and survives changing agents.

## Things that cost us time

Listed because they are not in anyone's getting-started guide:

- **A laptop and a CI runner are different computers.** Four of our worst bugs came from that
  one fact: a tool that spawns `wmic.exe` (removed in Windows 11), a preview server that
  daemonises on Windows and blocks on Linux, `prettier --check` disagreeing with itself over
  line endings, and shell commands that only parse in one shell.
- **`--max-turns` is the wrong way to bound agent cost.** It stops work halfway and charges
  full price for nothing. Use a job timeout.
- **Automation-mode agents get no tools by default.** Ours ran, exited zero, and did nothing.
  A silent green no-op is worse than a crash.
- **GitHub does not trigger workflows from its own token**, so a bot-opened issue cannot start
  an agent. That turned out to be correct: a breach is evidence, not a decision.
- **A run waiting at an approval gate still holds its concurrency group.** One forgotten
  approval froze every deploy for seventeen hours while the site served stale content.

The full list, with numbers, is in [section 09 of the site](https://rashid.fr/sdlc/#scars).

## Cost

Claude Pro, no API billing. CI authenticates with an OAuth token, which means **agent runs in
CI bill the same weekly quota as the terminal** — that single fact shaped most of the
architecture. Four of the seven workflows spend nothing at all.

## Licence

No licence yet. Ask before reusing.
