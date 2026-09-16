# sdlc-demo

A static site that explains the AI-native SDLC and is built by it. The repository is the
evidence for the talk, so how the work is done matters as much as what ships.

Canonical instructions for every agent — Claude Code, Cursor, Codex. `CLAUDE.md` imports
this file rather than restating it.

## Commands

| Command                                   | What it does                                                                        |
| ----------------------------------------- | ----------------------------------------------------------------------------------- |
| `npm run verify`                          | build → serve at the real base → crawl every link → run evals. **The one command.** |
| `npm run dev`                             | Astro dev server                                                                    |
| `npm run build`                           | production build (`/sdlc/`)                                                         |
| `VERIFY_BASE=sdlc-preview npm run verify` | verify the preview target                                                           |

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

- **`NNNN` is the GitHub issue number**, zero-padded. Every intent has an issue; the issue is
  where the framing is argued and the number is where the id comes from. Never increment from
  the directory listing — two people drafting at once pick the same number and neither can
  tell. That has already happened here. `0000`–`0003` predate the rule and keep their numbers.
- Never skip an artifact. If one is missing, write it before writing code.
- `spec.md` links its `intent.md`; `plan.md` links its `spec.md`. The evals check this.
- Design decisions belong in `spec.md` as numbered rows (D1, D2, …) so later work can cite them.
- Superseding a decision means editing the spec and saying so — not quietly diverging.
- **Answer open questions in the artifact, not in a pull request comment.** A comment on a
  merged pull request is read by nobody and by no script. Edit the file on the branch.

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

## End every reply with the commands

Whenever a reply asks the operator to do something, it ends with a section listing those
things as commands they can run. Not a description of the action — the command.

- **One command per fenced `bash` block.** The terminal renders a Run button per block, so
  two commands in one block means one of them gets skipped or edited by hand.
- **Never chain with `&&`.** PowerShell 5.1 has no `&&`, and the operator works there. This
  is already listed below as a mistake and it keeps happening; it belongs here too, where it
  is read before the reply rather than after the error.
- **Say what cannot be a command.** Approving a deployment, editing a file on a branch in the
  web UI and applying a label are clicks. Name the exact path — _Actions → the run → Review
  deployments → Approve_ — rather than omitting them and leaving a half-list.
- **Nothing to do is a valid ending.** Say so explicitly. A reply with no command section and
  no "nothing for you" line is indistinguishable from one that forgot.

This exists because the rule already lived in `.claude/skills/sdlc/SKILL.md`, which only
applies while that skill is running — so the commands appeared during a stage and not
otherwise, and the difference looked arbitrary from the outside. Same failure as every other
one on this list: a rule in a place that is read sometimes.

## Mistakes already made here — do not repeat them

- **Absolute asset paths break the build.** Both deploy targets live in a subfolder
  (`/sdlc/` and `/sdlc-preview/`), so `/favicon.svg` 404s. Use
  `import.meta.env.BASE_URL`. The Astro template shipped with this bug.
- **`astro preview` reads `base` from the config, not from the build output.** Pass `--base`
  to both or the link check happily validates the wrong path.
- **Windows PowerShell 5.1 has no `&&`,** and its `curl` is an alias for `Invoke-WebRequest`,
  which rejects curl's flags. Never chain shell commands in an `npm` script, a hook, or
  documentation, and never write bare `curl` in an instruction a colleague will paste — use
  `curl.exe`, or `Invoke-RestMethod`. This is why `verify` is a Node script rather than shell
  glue: anything with shell in it is a portability bug waiting for a reader on another OS.
- **Git Bash rewrites leading-slash arguments into Windows paths.** Pass base values
  slashless (`sdlc-preview`); `scripts/verify.mjs` normalises them.
- **`start-server-and-test` spawns `wmic.exe`**, which Windows 11 removed. Do not add it back.
- **Never read `$?` after a pipe.** `npm run verify | grep ...; echo $?` reports _grep's_
  status, so a hanging or failing command looks green. This produced a false pass that hid
  a real hang for two rounds. Capture the exit code of the command itself, and check elapsed
  time when a hang is possible.
- **`astro preview` daemonises on Windows but runs in the foreground on Linux.** A blocking
  `spawnSync` therefore returns on a laptop and hangs forever in CI. `scripts/verify.mjs`
  spawns it asynchronously and exits explicitly.
- **Line endings made `prettier --check` disagree with itself** — CRLF on the Windows working
  tree, LF in CI, so the same commit was clean on the runner and dirty on the laptop.
  `.gitattributes` now forces `eol=lf` everywhere. Do not add `endOfLine: "auto"` instead;
  that hides the divergence rather than removing it.
- **`site/CLAUDE.md` is a symlink to `site/AGENTS.md`.** Astro scaffolds it that way. Writing
  to one writes through to the other, so edit `site/AGENTS.md` and leave the link alone.
  Overwriting it once left `site/AGENTS.md` importing itself.

## Cost

Claude Pro only, and CI agent runs bill the same weekly quota as interactive work. Keep this
file short — it is re-read on every run. Do not add agent jobs to CI without saying what they
cost. Stages 4 and 6 are deterministic and must stay that way.
