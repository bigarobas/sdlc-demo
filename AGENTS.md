# sdlc-demo

A static site that explains the AI-native SDLC and is built by it. The repository is the
evidence for the talk, so how the work is done matters as much as what ships.

Canonical instructions for every agent — Claude Code, Cursor, Codex. `CLAUDE.md` imports
this file rather than restating it.

## Commands

| Command | What it does |
|---|---|
| `npm run verify` | build → serve at the real base → crawl every link → run evals. **The one command.** |
| `npm run dev` | Astro dev server |
| `npm run build` | production build (`/sdlc/`) |
| `VERIFY_BASE=sdlc-demo/preview npm run verify` | verify the preview target |

Never claim work is done without `npm run verify` passing. Prefer the `verifier` subagent so
build output stays out of the implementation context.

## Node 22 is required

Astro 5 refuses Node 20. `.nvmrc` pins 22.19.0. On this Windows machine `nvm use` needs
elevation and fails silently, so prefix the PATH instead of assuming the switch worked:

```
export PATH="/c/Users/rashi/AppData/Roaming/nvm/v22.19.0:$PATH"
```

## The SDLC loop

Work moves through version-controlled artifacts in `docs/sdlc/NNNN-slug/`:

`intent.md` → `spec.md` → `plan.md` → diff → PR → deploy → (control band breach) → new `intent.md`

- Never skip an artifact. If one is missing, write it before writing code.
- `spec.md` links its `intent.md`; `plan.md` links its `spec.md`. The evals check this.
- Design decisions belong in `spec.md` as numbered rows (D1, D2, …) so later work can cite them.
- Superseding a decision means editing the spec and saying so — not quietly diverging.

## Guardrails — do not fight these

Hooks deny some actions outright. They are deterministic; retrying differently will not help.

- **You cannot edit `.github/workflows/**`, `.claude/settings.json`, `.claude/hooks/**`.**
  The agent cannot edit its own guardrails. When one of these needs changing, say so and
  stop — a human makes that commit under their own name.
- **You cannot force-push, `git reset --hard`, `curl | sh`, or push to `main`.**
  Use `--force-with-lease`, and open a PR.
- Production credentials live only in the `production` GitHub Environment, behind a required
  human approval. They are not available to you, by design.

**Proposing a guardrail change.** Blocked files still need writing sometimes. Write the
proposed version to `proposals/<same path>` — for example
`proposals/.github/workflows/deploy.yml` — and tell the human what changed and why. They
review it, copy it into place, and commit it under their own name. Delete the proposal once
it is installed. The agent drafts; the human installs. Never route around a hook with a
shell command: doing so would make every guardrail in this repository decorative, and the
site would be claiming something untrue.

## House style

The site is long-scroll with a sticky section nav. No keyboard deck navigation.
Design constraints live in `.claude/skills/house-style/` — apply them, do not reinvent them.

Prose: plain, specific, no marketing register. This site argues that the honest version of
a thing beats the impressive-sounding version, so it should read that way. Shells are
labelled as shells.

## Mistakes already made here — do not repeat them

- **Absolute asset paths break the build.** Both deploy targets live in a subfolder
  (`/sdlc/` and `/sdlc-demo/preview/`), so `/favicon.svg` 404s. Use
  `import.meta.env.BASE_URL`. The Astro template shipped with this bug.
- **`astro preview` reads `base` from the config, not from the build output.** Pass `--base`
  to both or the link check happily validates the wrong path.
- **Windows PowerShell 5.1 has no `&&`.** Never chain shell commands in an `npm` script, a
  hook, or documentation. Write a Node script instead — that is why `verify` is `.mjs`.
- **Git Bash rewrites leading-slash arguments into Windows paths.** Pass base values
  slashless (`sdlc-demo/preview`); `scripts/verify.mjs` normalises them.
- **`start-server-and-test` spawns `wmic.exe`**, which Windows 11 removed. Do not add it back.
- **`site/CLAUDE.md` is a symlink to `site/AGENTS.md`.** Astro scaffolds it that way. Writing
  to one writes through to the other, so edit `site/AGENTS.md` and leave the link alone.
  Overwriting it once left `site/AGENTS.md` importing itself.

## Cost

Claude Pro only, and CI agent runs bill the same weekly quota as interactive work. Keep this
file short — it is re-read on every run. Do not add agent jobs to CI without saying what they
cost. Stages 4 and 6 are deterministic and must stay that way.
