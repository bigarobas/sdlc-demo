# Spec 0003 — Graphical repo tree, generated

Implements [intent.md](./intent.md), and absorbs
[intent 0049](../0049-generated-repo-tree/intent.md).

Supersedes an earlier version of this spec ([#57](https://github.com/bigarobas/sdlc-demo/pull/57),
closed) that built the tree by hand and left generation to 0049. That split was wrong, and the
measurement that showed it is in D1.

## 1. Guiding decisions

| #   | Decision | Why, and where it comes from |
| --- | --- | --- |
| D1 | **One piece of work, not two.** The tree is generated from the first commit; 0049 is absorbed rather than sequenced after this. | _Measured:_ `deriveModel()` already returns **22 nodes carrying a file path** — 10 workflows, 5 hooks, 5 skills, 2 subagents — each with `id`, `kind`, `label` and `file`. It has been in the repository since the pipeline diagram shipped. The work imagined as "make it dynamic later" is mostly already done. |
| D2 | The split that mattered was never static-versus-generated. It is **structure versus prose**. | Structure — what exists, how it nests — is derivable and therefore cannot go stale. Prose — what each file is _for_ — is hand-written under either plan. Building the static version first would have meant hand-writing a file listing, validating the visuals against it, and discarding it, because whether the tree _looks_ right is independent of where its data comes from. |
| D3 | The extra entries come from a **new module that consumes `deriveModel()`**, not from extending it. | Extending the deriver would add top-level config files and `docs/sdlc/` entries to the pipeline diagram, where they do not belong — and would immediately fail the diagram's own "every derived node has an annotation" eval. The tree is a second consumer of one deriver, not a second deriver. |
| D4 | Descriptions live in a **hand-written file keyed by path**, with an eval that fails when an entry is missing. | The pattern already exists and already works: `annotations.json` forces someone to say what a new workflow is for before CI passes. This is the same contract for a different field. |
| D5 | That file is **separate from `annotations.json`**, and the two cannot contradict each other. | I raised "a second hand-maintained inventory" as a risk on the closed spec. They key differently — node id versus path — and share no fields: `annotations.json` holds `lane`, `stage`, `cost`; this holds `short` and `detail`. Different facts about the same objects is not duplication. Merging them would force the tree's config-file entries into the diagram's annotation set, which its eval rejects. |
| D6 | The generated tree is **committed and drift-checked** by `npm run verify`, like `pipeline.svg`. Not gitignored like `build-info.json`. | _From 0049's outcome test:_ "delete a workflow file, run `npm run verify`, and watch it go red without touching `site/`." That only works if a committed artifact can disagree with the repository. |
| D7 | Rendered from `index.astro`, injected on `slug === 'this-repo'`. | _From the code._ Sections are plain `.md` rendered through `<Content />`; embedding a component needs MDX. The precedent is four lines away — the pipeline diagram is injected exactly this way on `slug === 'pipeline'`. |
| D8 | Semantic nested `<ul>`/`<li>`, with connector lines drawn by **CSS pseudo-elements**. | _From the outcome:_ "without decoding a code block", and answer 1's tree-view branch lines. Box-drawing characters (`├─ └─`) were cheaper and are rejected — that is the monospace block again with extra steps. |
| D9 | Entry kinds are marked by **colour and a short text label**, not an icon set. | _From house-style:_ one accent colour, no new dependency; a 53 kB page should not gain a font to draw a folder. **This is the row most likely to be wrong** — see the risks. |
| D10 | Collapsible detail uses native `<details>`/`<summary>`. | _From answer 4:_ short description visible, detail collapsible. Works with JavaScript off, keyboard-accessible for free. Spec 0002 D6 rejected `<details>` for the nav; that objection was about forcing it open above a breakpoint and does not apply here. |
| D11 | The existing fenced code block is **replaced**. `docs/sdlc/` shows one example chain plus a count of the rest. | _From the issue, verbatim:_ "do not add all sdlc/ folder entries (just one for example 0002-navigation-usability with its intent,spec,plan)". The count stops the omission reading as "there are only two". |
| D12 | The page says: **the structure is generated and checked; the wording is human and dated.** | Section 05 claims "Nothing here is illustrative" four lines above this tree, and that sentence was false once already. Under D1 the admission shrinks to something small and true — a sentence, not a disclaimer. |

## 2. Design

**Deriving — `scripts/repo-tree/model.mjs`.** Calls `deriveModel()`, keeps the nodes with a
`file`, and adds by directory walk:

- top-level configuration currently shown in the section: `bands.yaml`, `package.json`,
  `.nvmrc`, `evals/run.mjs`, `.claude/settings.json`
- exactly one `docs/sdlc/` chain — `0002-navigation-usability` with its three artifacts — and
  a count of the remaining directories

Output is a flat array; `path` carries the nesting, so no nested structure has to be kept
consistent with itself.

**Describing — `scripts/repo-tree/descriptions.json`**, keyed by path:

```json
{
  ".claude/hooks/guard-bash.mjs": {
    "short": "refuses dangerous shell commands",
    "detail": "Denies force-push, reset --hard, curl piped to a shell, and writes to the default branch. Matches the raw command string, which is why it also refuses prose quoting those commands."
  }
}
```

`detail` is optional; an entry without one renders as a plain row rather than an empty
disclosure.

**Generating — `npm run repo-tree`, and `--check` inside `verify`.** Writes
`site/src/generated/repo-tree.json`, committed. `--check` regenerates to a buffer and fails on
any difference, exactly as `scripts/diagram.mjs --check` does. It also fails when a derived
path has no description, which is the D4 contract.

**Rendering — `site/src/components/RepoTree.astro`**, the first component in the project.
Reads the generated JSON, groups by depth, emits nested `<ul>`. Each `<li>` is a plain row or
a `<details>` whose `<summary>` is the whole row.

**Styling — `global.css`, scoped under `.repo-tree`.** Connectors are `::before` on each `li`
and `::after` on each nested `ul`, stopping at the last child. Colours from existing tokens;
`kind` adds a modifier class. Both colour schemes. Below `40rem` the indent shrinks and the
type label drops to colour alone.

## 3. Deliberate omissions

- **No icon set.** D9. If pictograms were wanted, that is a dependency decision on its own.
- **No animation.** Answer 4 asked for disclosure, not motion.
- **No per-file size, line count or git history.** None asked for; all would rot faster than
  the descriptions.
- **The descriptions are still not verified true.** The eval forces one to _exist_ for every
  derived path. Nothing checks it is accurate — that needs a reader, and saying otherwise
  would be the same overclaim D12 exists to prevent.

## 4. Risks

| Risk | Mitigation |
| --- | --- |
| **"Don't make a svg or image" may have meant no vector glyphs at all, or only no static picture of the tree.** D9 reads it the second way and then avoids icons for a different reason. | Flagged, not assumed. If pictograms were wanted, D9 is the row to reject and it changes only the markers — D1–D8 stand. |
| **Extending the deriver would break the pipeline diagram.** Adding config files to `deriveModel()` puts them in the diagram and fails its annotation eval. | D3 makes the tree a second _consumer_. The plan must assert the diagram's node count is unchanged — 27 before and after. |
| **A description can be present and wrong.** Structure is now self-correcting; prose is not. | Named in the omissions and on the page under D12. This is the honest residue of the whole intent, and it is much smaller than it was. |
| **Page weight.** The band breaches at 512 000 bytes; the built `index.html` is 52 867. | Ten times the headroom for roughly 33 entries. Measured from the local build — production did not answer a transfer-size check, so the plan re-confirms. |
| **`<details>` inside a list can be awkward for screen readers.** | `<summary>` wraps the entire row. Verify by keyboard before the pull request. |
| **Thirty-three entries is tall** in one section of eleven. | `detail` is collapsed by default. If still too tall, group by top-level directory — a plan-time measurement, not a design decision. |

## 5. How completion is proven

- `npm run verify` green on both base paths.
- **Delete a workflow file, run `npm run verify`, and it fails** without anything under
  `site/` being touched. This is 0049's test and it is now this intent's test.
- Add a workflow without a description and `verify` fails naming the missing path.
- The pipeline diagram still derives 27 nodes.
- The tree renders with JavaScript disabled, at 380 px, in both colour schemes.
- The D12 sentence is on the page, not only in this spec.

## 6. What this needs from a human first

The intent's answer 5 says "No for now" to automatic sync. D1 supersedes it. `intent.md` is
`accepted`, so `protect-approved.mjs` denies the agent editing it — that hook working as
designed. **The intent's answer 5 must be amended by hand before this spec is accepted**, or
the repository holds two contradictory statements about the same decision.
