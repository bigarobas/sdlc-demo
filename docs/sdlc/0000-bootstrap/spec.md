# Spec 0000 — Architecture

Implements [intent.md](./intent.md).

## 1. Guiding decisions

| # | Decision | Why |
|---|---|---|
| D1 | **Hooks are Node scripts** (`node .claude/hooks/*.mjs`), not bash or PowerShell | Node is the only runtime present on both a Windows laptop and an `ubuntu-latest` runner. Also readable by colleagues on any OS. |
| D2 | **`AGENTS.md` is canonical**; `CLAUDE.md` is `@AGENTS.md` plus Claude-only extras | One source of truth. Cursor and Codex read `AGENTS.md` natively, so portability is free rather than a maintenance tax. |
| D3 | **The Maintain → Plan closure is fully deterministic** — cron, `curl`, thresholds, `gh issue create`. Zero tokens. | The loop-closing moment is the most impressive part of the demo and the cheapest to build. It must never fail for quota reasons. |
| D4 | **Three agent workflows, all hard-capped** — see §4 | CI bills the same Pro quota as the terminal. A runaway workflow the night before the talk eats the demo. Two of the three come free from `/install-github-app`. |
| D5 | **The agent cannot edit its own guardrails** — a hook denies writes to `.github/workflows/**`, `.claude/settings.json`, `.claude/hooks/**` | This is the governance thesis in one sentence, and it demos in ten seconds. |
| D6 | ~~Preview = rolling GitHub Pages; production = FTP behind a manual-approval Environment~~ **Superseded 2026-09-10 by D8.** | The production credential is the one thing the agent is structurally denied. That asymmetry *is* the production gate. Still true; only the preview half changed. |
| D7 | **Verification is one command**, `npm run verify` | Same command locally, in the `verifier` subagent, and in CI. An agent that can check its own work needs a single obvious way to do it. |
| D8 | **Three tiers of credential reach**, all on owned infrastructure: agent and `verify` jobs hold no deploy credential; `preview` uses an FTP user chrooted to `/www/sdlc-preview/` with no approval gate; `production` uses a separate FTP user behind a required reviewer | Briefly making the repository private deleted the Pages site *and* silently disabled environment protection rules and environment secrets, which on GitHub Free are public-repository features. A gate that can vanish because of an unrelated settings change is not a gate. Moving both targets to the FTP host removes that dependency, and the scoped preview user makes the point sharper: environments are about **blast radius**, and approval is a separate axis on top. |
| D9 | ~~`verify` includes Playwright screenshots of each section~~ **Superseded 2026-09-11.** `verify` is build + link check + evals + diagram drift. No screenshots. | Never built, and the spec claimed it for four days — found by running `/sdlc` against this intent rather than by anyone reading the file. Superseded rather than implemented because **not one of the failures in section 09 of the site was visual**: they were base paths, process semantics, permissions, races and stale claims. Screenshots would have added Chromium to every CI run to guard against the one class of bug this project has never once produced. Revisit if a visual regression ever actually ships. |

## 2. Repository layout

```
.
├── AGENTS.md                     # canonical instructions (Cursor / Codex / Claude)
├── CLAUDE.md                     # @AGENTS.md + Claude-specific extras
├── README.md                     # the setup guide, for colleagues copying this
├── bands.yaml                    # control bands: what "healthy" means, in numbers
│
├── .claude/
│   ├── settings.json             # hooks + permissions, committed and shared
│   ├── skills/
│   │   ├── intent/SKILL.md       # idea or issue  -> intent.md
│   │   ├── sdlc/SKILL.md         # move a piece of work to its next stage
│   │   ├── spec/SKILL.md         # intent.md      -> spec.md
│   │   ├── ship/SKILL.md         # plan.md + diff -> PR, changelog, Slack ping
│   │   └── house-style/SKILL.md  # the site's design constraints (a real "brand" skill)
│   ├── agents/
│   │   ├── verifier.md           # runs `npm run verify`, reports pass/fail only
│   │   └── simplifier.md         # post-implementation reduction pass
│   └── hooks/
│       ├── protect-guardrails.mjs  # PreToolUse(Write|Edit): deny self-modification  [D5]
│       ├── protect-approved.mjs    # PreToolUse(Write|Edit): deny edits to accepted artifacts
│       ├── guard-bash.mjs          # PreToolUse(Bash): deny force-push, rm -rf, curl-pipe-shell
│       ├── format.mjs              # PostToolUse(Write|Edit): prettier the touched file
│       └── audit.mjs               # PostToolUse + Stop: append to docs/sdlc/audit-log.md
│
├── docs/sdlc/
│   ├── REVIEW.md                 # review policy + severity definitions
│   ├── audit-log.md              # hook-written, GITIGNORED (permanently dirty tree)
│   └── NNNN-slug/{intent,spec,plan}.md
│
├── evals/
│   ├── run.mjs                   # structural assertions, regex-level, zero tokens
│   └── cases/*.json
│
├── .github/
│   ├── ISSUE_TEMPLATE/intent.yml
│   └── workflows/
│       ├── verify.yml            # deterministic: build + links + evals + diagram  [D9]
│       ├── preview.yml           # PR -> scoped FTP user -> /sdlc-preview/  [D8]
│       ├── deploy.yml            # main -> `production` Environment gate -> FTP
│       ├── claude.yml            # AGENT 1: @claude mentions — the steering wheel
│       ├── agent-intent.yml      # AGENT 2: issue labelled `intent` -> intent.md PR
│       ├── claude-code-review.yml # AGENT 3: PR -> /code-review --comment
│       ├── bands.yml             # cron: check bands.yaml -> open issue on breach  [D3]
│       └── security.yml          # SHELL: npm audit + a commented-out agent step
│
└── site/                         # Astro
    ├── astro.config.mjs          # site/base from env: preview vs production
    └── src/content/sections/*.md
```

## 3. The six stages, mapped to this repo

| Stage | Trigger | What runs | Human gate | Cost |
|---|---|---|---|---|
| 1 Plan | Issue with `intent` label | `agent-intent.yml` drafts `intent.md`, opens PR | You merge the PR | ~1 agent run |
| 2 Design | `intent.md` on `main` | `/spec` skill, in your terminal | You accept `spec.md` | Pro, interactive |
| 3 Build | `spec.md` accepted | Plan mode → `plan.md` → implement, in your terminal | You accept the plan | Pro, interactive |
| 4 Test | Every push | `verify.yml`: build, link check, evals, formatting, diagram drift | — | **free** |
| 5 Deploy | PR opened, then merge | `claude-code-review.yml` comments; `preview.yml` posts a URL; `deploy.yml` waits on the gate | You approve the Environment | ~1 agent run |
| 6 Maintain | Cron, every 6h | `bands.yml` checks the live site, opens an `intent` issue on breach | You triage | **free** |

Stage 6 opening an `intent`-labelled issue is what re-triggers Stage 1. The circle closes,
and the closing half of it costs nothing.

## 4. Mechanisms

### Skills — five, all real

`intent`, `spec` and `ship` encode the artifact templates and the questions each stage must
answer. `house-style` encodes the site's design constraints, and is the honest static-site
analogue of the playbook's `secure-api-review` example: institutional knowledge applied as a
constraint during implementation, not a prompt you retype.

`sdlc` was added later and is a different shape: it orchestrates rather than templates,
working out which stage a piece of work is at and doing that one. Its companion,
`npm run intents`, is deliberately a **script and not a skill** — reading which artifacts
exist and what `Status:` says needs no judgement, and a script answers identically every time
and costs nothing. Spend a model only where a decision is required.

### Hooks — five, all real, all deterministic

The point on stage is the contrast: the model is probabilistic, the hook is not.
`protect-guardrails.mjs` is the demo — ask Claude to edit `deploy.yml`, watch it denied.

### Subagents — two

`verifier` runs `npm run verify` in its own context window and reports only pass/fail, so
build noise never pollutes the implementation session. `simplifier` does a reduction pass.

### Agent workflows — three (revised from D4's original "two")

| # | Workflow | Mode | Role |
|---|---|---|---|
| 1 | `claude.yml` | interactive, `@claude` mentions | The steering wheel. Drafts, implements, answers. Installed free by `/install-github-app`. |
| 2 | `agent-intent.yml` | automation, issue labelled `intent` | The autonomy proof: nobody typed anything, and an `intent.md` PR appeared. Custom. |
| 3 | `claude-code-review.yml` | automation, on pull request | Review comments. Installed free by `/install-github-app`. |

Two agent jobs could not cover one full cycle: drafting the intent, implementing the change
and reviewing the result are three distinct triggers. Only #2 is written by hand. A full
cycle costs roughly one small run, one medium run and one small run.

### MCP

The GitHub MCP tools already used by the CI agent jobs. No custom server — it would cost an
evening and teach nothing the audience does not already believe.

### Verification loop — `npm run verify`

`astro build` + `linkinator` over the served output + the eval suite + the diagram drift
check. One command, four signals, no tokens. No screenshots — see D9.

## 5. Deliberate shells, labelled as such on the site

| Shell | What exists | What is missing | Why |
|---|---|---|---|
| Evals | `evals/run.mjs`, asserting the structure of generated artifacts (does `intent.md` carry all five sections? does `spec.md` link its intent?), run in CI on `.claude/**` changes | No LLM-as-judge, no behavioural scoring | A real eval suite is the most token-hungry thing in the playbook. The structural version still makes the point: *configuration changes are regression-tested.* |
| Security | `npm audit --audit-level=high`, plus the agent step written and commented out | No scheduled agentic vulnerability scan | Costly, and a static site has almost no attack surface. Showing the commented-out step is more honest than faking a finding. |
| Control bands | `bands.yaml` with real thresholds, and a cron that genuinely checks them | Only availability, page weight and build time. No user-facing metrics, because there are no users | The mechanism is real; the metrics are toy. Say so on the slide. |

## 6. Cost control

- Three agent workflows (D4), each with `--max-turns 8`, `timeout-minutes: 10`, and a
  `concurrency` group with `cancel-in-progress: true`.
- `--model claude-sonnet-5` for the CI jobs. Opus stays for interactive design work.
- `CLAUDE.md` stays short — it is re-read on every single run.
- Everything in Stage 4 and Stage 6 is deterministic and free.

## 7. Portability

`AGENTS.md` carries the content (D2). The site gets one mapping section, text only:

| Concept | Claude Code | Cursor |
|---|---|---|
| Instructions | `CLAUDE.md` → `@AGENTS.md` | `AGENTS.md`, `.cursor/rules/*.mdc` |
| Skills | `.claude/skills/*/SKILL.md` | Rules with `description` + globs; commands |
| Hooks | `.claude/settings.json` hooks | Cursor hooks |
| Subagents | `.claude/agents/*.md` | Background agents |
| CI agent | `anthropics/claude-code-action` | Cursor background agents, or your own runner |

The row that does not port cleanly is hooks — and that is worth saying out loud. The
deterministic layer is where the ecosystems differ most.

## 8. Risks

| Risk | Mitigation |
|---|---|
| Pro quota exhausted before the talk | D4 caps; full dry run on 2026-09-14, not 2026-09-22 |
| Live agent run stalls on stage | Fire it at minute 2, harvest at minute 20; pre-recorded 90s fallback |
| FTP deploy is flaky | Deploy to a staging subfolder first; keep the previous release on the host |
| Astro `base` path breaks assets | *Both* builds are non-root (§9), so the bug cannot hide in production only. One fixed `/preview/` path, never per-PR paths. |
| Scope creep past five evenings | Trello, Slack-as-teammate, a custom MCP server and real evals are all explicitly backlog |

## 9. Concrete URLs, base paths, and the demo feature

| Build | URL | `base` |
|---|---|---|
| Production | `https://rashid.fr/sdlc/` | `/sdlc/` |
| Preview | `https://rashid.fr/sdlc-preview/` | `/sdlc-preview/` |

Neither is root, which is a small mercy: a hardcoded absolute path breaks in *both*
environments rather than only in production, on stage. `astro.config.mjs` reads `SITE` and
`BASE` from the environment; `npm run verify` builds with the preview values.

**Live-cycle feature.** The issue filed on stage asks for a *visible cosmetic change that the
`house-style` skill constrains* — for example, adding a callout box to the Governance
section. This is deliberately small, but it is not arbitrary: it exercises the whole chain
(skill applied as a constraint → verify → preview URL → gate), and the audience can
confirm the result in one glance from the back of the room. Fix the exact wording during the
2026-09-14 rehearsal and do not improvise it live.
