# Plan 0003 — Graphical repo tree, generated

Implements [spec.md](./spec.md), from [intent.md](./intent.md).

## Measurements the spec asked the plan to confirm

Both confirmed before writing any code.

| What                          | Spec assumed                             | Confirmed                                                                                                                                   |
| ----------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Page weight against the band  | 52 867 bytes local, production unverified | **53.0 kB against a budget of 512.0 kB**, measured by `node scripts/check-bands.mjs` — the band's own script, against production, not my curl |
| Diagram node count            | 27, must not change                      | **27**, `npm run check:diagram`                                                                                                             |
| Derived nodes with a file path | 22                                        | **22** — 10 workflows, 5 hooks, 5 skills, 2 subagents                                                                                        |

One thing the spec did not know: **`site/src/generated/` is not ignored wholesale.** Only
`build-info.json` is listed in `.gitignore`, and `pipeline.svg` is tracked. So D6's committed
artifact needs no `.gitignore` change — `repo-tree.json` is committed by default, which is the
behaviour wanted.

## Files

| File                                        | Change | What                                                                 |
| ------------------------------------------- | ------ | -------------------------------------------------------------------- |
| `scripts/repo-tree/model.mjs`               | new    | consumes `deriveModel()`, adds the walk, returns a flat node array   |
| `scripts/repo-tree/descriptions.json`       | new    | hand-written `short` / optional `detail`, keyed by path              |
| `scripts/repo-tree.mjs`                     | new    | CLI: regenerate, and `--check` for drift and coverage                |
| `site/src/generated/repo-tree.json`         | new    | committed output                                                     |
| `site/src/components/RepoTree.astro`        | new    | first component in the project; the directory does not exist yet     |
| `site/src/pages/index.astro`                | edit   | one branch beside the existing `slug === 'pipeline'` injection       |
| `site/src/styles/global.css`                | edit   | `.repo-tree` block, both colour schemes                              |
| `site/src/content/sections/05-this-repo.md` | edit   | remove the fenced block; add the D12 sentence                        |
| `evals/run.mjs`                             | edit   | coverage and shape assertions                                        |
| `scripts/check.mjs`                         | edit   | wire `repo-tree --check` into the fast path                          |
| `package.json`                              | edit   | `repo-tree` and `check:repo-tree` scripts                            |

`scripts/repo-tree.mjs` follows `scripts/diagram.mjs` deliberately — same `--check` flag, same
coverage-first ordering, same failure message shape. A second convention for the same job is a
second thing to learn.

## Order of work

Each step ends somewhere verifiable, so a failure is attributable to the step that caused it.

1. **Model and CLI, no site changes.** Build `repo-tree/model.mjs` and `repo-tree.mjs`, write
   `descriptions.json` by reading each file. Prove: `npm run repo-tree` emits ~33 entries;
   `npm run check:diagram` still says **27 nodes**. If the diagram moved, D3 has been violated
   and the walk has leaked into `deriveModel()`.
2. **Evals.** Coverage — every derived path has a `short`. Shape — every entry has `path` and
   `kind`. Prove: delete a description, `npm run check` fails naming the path; restore it,
   green.
3. **Drift wiring.** `--check` into `check.mjs`. Prove: **delete a workflow file, run
   `npm run verify`, watch it fail with nothing under `site/` touched.** This is the test
   inherited from 0049 and the one that matters most.
4. **Component and injection, unstyled.** Prove: `npm run verify` green on both bases, link
   check passes, the tree is in the HTML.
5. **Styles.** Connector lines, kind colours, `<details>`. Prove: renders at 380 px, correct in
   both colour schemes, readable with JavaScript disabled.
6. **Section prose.** Remove the fenced block, add the D12 sentence. Prove: `npm run verify`
   green; section 05 contains no code fence listing the repository.
7. **Final.** `VERIFY_BASE=sdlc-preview npm run verify` as well as the default. Re-run
   `check-bands.mjs` against the preview once it is published.

Steps 1–3 touch nothing under `site/`, so they neither build nor deploy — `checks.yml` alone
covers them. The pull request will cross that boundary at step 4, which is when `verify`,
`preview` and eventually `deploy` start running.

## Risks, and what this plan does about them

| Risk                                                                                                                        | What the plan does                                                                                                                                                                                                                |
| --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **The walk leaks into `deriveModel()` and changes the diagram.** Spec D3.                                                    | Step 1 asserts 27 nodes before any site work. The eval added in step 2 keeps asserting it afterwards, so a later edit cannot quietly do it either.                                                                                 |
| **`descriptions.json` becomes the fourth hand-written inventory** if its scope creeps.                                       | It holds `short` and `detail` only. Anything derivable — kind, nesting, presence — comes from the model. A field that could be derived and is typed instead is the bug this intent exists to remove.                              |
| **Writing ~33 descriptions is the bulk of the work and the easiest place to be careless.** They are prose about real files.  | Written by reading each file, not from memory. Where a file's purpose is already stated in its own header comment, the description paraphrases that rather than inventing a second account of it.                                  |
| **Page grows and the band fires overnight.**                                                                                | 53 kB of 512 kB is ten times the headroom, and `<details>` bodies ship as markup regardless of collapse. Re-check at step 7 rather than assume; the band is a cron, so a breach would arrive as an issue and not as a failed build. |
| **D9 (colour and text, no icons) may be the wrong reading of "no svg or image".**                                            | Kind markers are one modifier class and one label per row. If D9 is rejected after seeing it, the change is confined to that class — steps 1–4 are unaffected.                                                                     |
| **`<details>` keyboard and screen-reader behaviour** inside nested lists.                                                    | Step 5 tabs through it before the pull request. `<summary>` wraps the whole row, so the focus target and the click target are the same element.                                                                                    |
| **A description can be present and wrong.** The residue the spec admits.                                                     | Not solved, and not claimed to be. The D12 sentence on the page says the wording is human; nothing in this plan pretends an eval checks accuracy.                                                                                  |

## How completion is proven

- `npm run verify` green at both base paths.
- **Delete a workflow file → `npm run verify` fails**, with nothing under `site/` touched.
- Add a derived path with no description → `npm run check` fails naming it.
- `npm run check:diagram` still reports **27 nodes**.
- Section 05 contains no fenced listing of the repository.
- The tree renders with JavaScript disabled, at 380 px, in both colour schemes.
- The D12 sentence is on the page.
- `node scripts/check-bands.mjs` still passes against the deployed preview.

## Cost

One implementation cycle. Intents 0001 and 0002 came in at $0.19–$0.70 of quota-equivalent;
this is larger, mostly because of the descriptions. No new CI agent job, no new credential, no
new dependency. Steps 1–3 spend no CI quota at all — `checks.yml` is free.
