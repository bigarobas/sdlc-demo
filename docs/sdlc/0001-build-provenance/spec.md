# Spec 0001 — Build provenance in the footer

Implements [intent.md](./intent.md).

## 1. Guiding decisions

| #   | Decision | Why |
| --- | --- | --- |
| D1 | **Build-time only.** A generated file, read in Astro frontmatter. No runtime fetch, no client JavaScript. | The intent asks for it, and it is also the honest shape: provenance is a fact about the build, so it should be baked in at build time rather than looked up afterwards by a page that might itself be stale. |
| D2 | Generated into `site/src/generated/build-info.json`, and **gitignored** — unlike `pipeline.svg` in the same directory, which is committed. | The two files look alike and are opposites. The diagram is committed *because* it must be drift-checked: a stale one is a lie worth failing CI over. Build info is different on every build by definition, so committing it would mean a dirty tree after every `npm run build` and a diff on every commit — the audit-log mistake again. |
| D3 | Show **both** the commit SHA and the pull request number. | Decided by Rashid. The PR link is the one a human actually wants to click; the SHA is the one that always exists, because a `workflow_dispatch` deploy has no pull request at all. Showing one would mean picking between friendly and reliable. |
| D4 | The PR number is parsed from the squash-commit subject on production, and taken from the event payload on preview. | **This depends on squash merges.** GitHub writes `(#27)` into the subject of a squashed merge, which is where production gets it. If the repository ever switches to merge commits, the production PR link silently stops resolving — so it degrades to the SHA alone rather than showing a wrong number. |
| D5 | Environment comes from an explicit `BUILD_ENV`, set by each workflow. Never inferred. | Inferring "am I production?" from the base path or the hostname means the answer changes when either changes, which is exactly what happened when preview moved off GitHub Pages. An explicit variable is one line per workflow and cannot drift. |
| D6 | A local build says **`local`**, with the working-tree SHA and a dirty marker. It never invents a deploy time or a pull request. | Straight from the intent. A local build that claimed to be production would be the same class of false claim this whole feature exists to prevent. |
| D7 | Preview is marked **in the sticky nav**, not only in the footer. | Rashid asked for preview to be visually distinct. A footer badge only appears in a screenshot of the bottom of the page — and the screenshots that actually get taken are of the middle. The nav is on screen at every scroll position, so a marker there is the only one that reliably survives a crop. The footer still carries the detail. |
| D8 | No new runtime or build dependency. | `git rev-parse` and `process.env` cover everything. A page weighing 45 kB should not gain a package to print a commit hash. |

## 2. Design

### The generated file

`scripts/build-info.mjs` runs before every build and writes:

```json
{
  "env": "production | preview | local",
  "sha": "5c117e9",
  "shaFull": "5c117e9...",
  "pr": 27,
  "builtAt": "2026-09-12T05:13:32Z",
  "dirty": false
}
```

Resolution order for each field:

| Field | CI | Local |
| --- | --- | --- |
| `env` | `BUILD_ENV` | absent → `local` |
| `sha` | `GITHUB_SHA` | `git rev-parse HEAD` |
| `pr` | preview: event payload · production: `(#n)` in the commit subject | `null` |
| `builtAt` | now, at build | now, at build |
| `dirty` | always false | `git status --porcelain` non-empty |

Missing values are `null` and render as absent. **Nothing is guessed.**

### Where it appears

- **Footer** — every build. Environment, short SHA linking to the commit, PR number linking
  to the pull request when there is one, and the build time.
- **Nav** — preview builds only. A small `PREVIEW` marker beside the title, styled to be
  unmistakable at a glance and in a crop.

Production shows no environment marker in the nav. The absence is the signal: a page with a
marker is not production.

### Workflow changes

One line each: `deploy.yml` sets `BUILD_ENV: production`, `preview.yml` sets
`BUILD_ENV: preview` and passes the pull request number. Both are guardrail files, so they go
through `proposals/`.

## 3. Deliberate omissions

- **No staleness check.** The page cannot tell you it is behind `main` without a network call,
  and the intent forbids runtime lookups. It tells you *what* it is; comparing that to what it
  should be stays a human act — or a job for the control bands, which already watch the live
  site.
- **No build duration, branch name, or author.** Everything shown has to answer "is this
  current, and what produced it". Anything else is decoration on a page that argues against
  decoration.
- **No visual marker for local builds** beyond the footer text. Nobody screenshots a localhost
  page and mistakes it for production.

## 4. Risks

| Risk | Mitigation |
| --- | --- |
| The generated file is missing and the build fails | The generator runs as a `prebuild` step, so it cannot be skipped. The layout also tolerates absence and renders nothing rather than throwing. |
| Switching away from squash merges breaks the production PR link (D4) | It degrades to the SHA rather than showing a wrong number, and the dependency is written down here so the failure is diagnosable. |
| `builtAt` looks fresh on a cached page | Real, and not solved here. The SHA is the value to trust; the timestamp is context. |
| The preview marker is forgotten in a screenshot taken before this ships | It is the reason for D7, and the rehearsal on 2026-09-14 is the moment to check it. |
