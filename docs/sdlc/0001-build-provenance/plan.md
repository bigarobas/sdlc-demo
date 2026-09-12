# Plan 0001 — Build provenance in the footer

Implements [spec.md](./spec.md).

## A correction to the spec before starting

Spec §4 says the layout "tolerates absence and renders nothing rather than throwing". With a
plain `import buildInfo from '.../build-info.json'` that is **not achievable** — Vite resolves
imports at build time, so a missing file is a build error, not an empty object.

Two ways out. Either the file is always generated before any build, or the import is made
tolerant with `import.meta.glob`, which returns `{}` when nothing matches.

This plan does **both**, because they fail differently: the generator covers the normal case,
and the glob means a forgotten wiring produces a footer without provenance rather than a
repository nobody can build. Neither alone is enough — the spec's stated mitigation was the
weaker half.

## Order of work

Each step is independently checkable. Stop at any of them if the check fails.

**1. `scripts/build-info.mjs`** — the generator. No dependencies; reads `process.env` and
shells out to `git` only when CI variables are absent.

- `env` ← `BUILD_ENV`, else `local`
- `sha` / `shaFull` ← `GITHUB_SHA`, else `git rev-parse HEAD`
- `pr` ← `PR_NUMBER` (preview, from the event) else the `(#n)` in the squash-commit subject
  (production) else `null`
- `builtAt` ← now, ISO, UTC
- `dirty` ← `git status --porcelain` non-empty, and only meaningful locally

*Check:* run it directly. It should print `local`, a real seven-character SHA, `pr: null`,
and `dirty: true` while this branch is in progress.

**2. Wiring, which is the part most likely to go wrong.**

`npm run verify` and CI both call `npm --prefix site run build` **directly**, not the root
`build` script — so a `prebuild` at the root would never fire. The hook belongs in
`site/package.json`:

```json
"prebuild": "node ../scripts/build-info.mjs",
"predev":   "node ../scripts/build-info.mjs"
```

*Check:* delete the generated file, run `npm run verify`, confirm it reappears.

**3. `.gitignore`** — add `site/src/generated/build-info.json`. It differs on every build by
construction (spec D2), and its neighbour `pipeline.svg` stays committed.

*Check:* `git status` is clean after a build.

**4. `site/src/layouts/Base.astro`** — read the file via `import.meta.glob` and render the
`PREVIEW` marker beside `.nav-title` when `env === 'preview'` (spec D7). Production and local
render no marker.

**5. `site/src/pages/index.astro`** — the footer, which lives here and not in the layout. Add
environment, short SHA linking to the commit, PR number linking to the pull request when one
exists, and the build time. Absent values render as absent.

**6. `site/src/styles/global.css`** — the marker and the footer metadata line. The marker must
be legible in a cropped screenshot, which is its entire reason for existing; it does **not**
use the accent pink, which means a human decision and nothing else.

**7. `proposals/.github/workflows/deploy.yml` and `preview.yml`** — `BUILD_ENV`, and
`PR_NUMBER` for preview. Guardrail files, so they go through `proposals/` for a human to
install. **This is the last step and the only one that cannot be checked before merging.**

## How completion is proven

Before the pull request:

- `node scripts/build-info.mjs` produces correct local values
- deleting the generated file and running `npm run verify` regenerates it
- `npm run verify` passes — 22 evals, links, diagram, both base paths
- the footer renders locally with `local`, a SHA and no PR
- `git status` clean after a build

After merging, and **not before** — these depend on workflow variables only CI supplies:

- the preview build shows `preview`, the PR number, and the nav marker
- the production deploy shows `production`, a SHA, and the PR number from the squash subject

## Risks

| Risk | Handling |
| --- | --- |
| `prebuild` in the wrong `package.json` and the file is never generated in CI | Step 2's check deletes the file and rebuilds. The glob fallback means the failure is a missing footer line, not a broken build. |
| The production PR number is parsed from a commit subject (spec D4) | Degrades to SHA-only. Worth checking on the first real deploy, because a wrong number would be worse than none. |
| The preview marker is invisible in practice | Only provable by looking. Check it on the preview URL of this pull request before merging — that is what the preview is for. |
| Generated file committed by accident | Step 3, and `git status` in the completion checks. |
| Page weight | A few dozen bytes against a 500 kB budget. The control band would catch a mistake anyway. |

## Not in this plan

Steps 1–6 are one pull request. Step 7 is a second one, because a human installs workflow
changes and bundling them would block the whole thing behind that handoff.
