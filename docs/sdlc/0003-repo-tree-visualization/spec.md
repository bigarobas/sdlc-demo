# Spec 0003 — Graphical repo tree in the implementation section

Implements [intent.md](./intent.md).

Written as a single stage, not by `--auto`. The intent carries five answers from the reporter
and two of them have consequences that only appear at design time, which is exactly the case
the skill says not to compress.

## 1. Guiding decisions

| #   | Decision                                                                                                                        | Why, and where it comes from                                                                                                                                                                                                                                                                                                                                                              |
| --- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | The tree renders from `index.astro`, injected on `slug === 'this-repo'`, the way the diagram is already injected on `'pipeline'`. | _From the code._ Sections are plain `.md` rendered through `<Content />`, so a component cannot be embedded in the markdown without converting the collection to MDX. That precedent exists and works; introducing MDX for one section means a second content format and a second way to author a page.                                                                                     |
| D2  | The tree's content lives in **one hand-authored data module**, `site/src/data/repo-tree.json`, separate from the markup.         | This is the most important row here. Answers 2 and 5 mean the content is written once by an agent reading the repository and then goes stale. Keeping data separate from rendering makes [0049](../0049-generated-repo-tree/intent.md) a change of _producer_ only — swap the hand-written file for a generated one and the component never moves. Inline markup would make 0049 a rewrite. |
| D3  | Semantic nested `<ul>`/`<li>`, not a `<pre>` block and not a table.                                                              | _From the outcome:_ "without decoding a code block". A pre block is what exists today and is the thing being replaced. Nesting is the actual structure, so the markup should be the structure — that is also what makes it readable to a screen reader and wrappable at 380px.                                                                                                             |
| D4  | Connector lines are drawn with CSS pseudo-elements on the nested lists.                                                          | _From the constraint_ "Don't make a svg or image", and from answer 1 asking for tree-view branch lines. Box-drawing characters (`├─ └─`) were the cheaper option and are rejected: they are text in a monospace column, which is the code block again with extra steps.                                                                                                                    |
| D5  | Entry types are marked by **colour and a short text label**, not by an icon set.                                                 | _From house-style:_ one accent colour, no new dependency, and a 53 kB page should not gain a font to draw a folder. See the risk table — this is the row most likely to disagree with what the reporter pictured by "icons".                                                                                                                                                                |
| D6  | Collapsible detail uses native `<details>`/`<summary>`.                                                                          | _From answer 4:_ short description visible, more detail collapsible. Native means it works with JavaScript disabled, is keyboard-accessible for free, and is findable by in-page search in most browsers. Spec 0002 D6 rejected `<details>` for the nav — that objection was specifically about forcing it open above a breakpoint, which does not apply here.                              |
| D7  | The existing fenced code block in `05-this-repo.md` is **replaced**, not kept alongside.                                          | Two inventories of the same repository is the problem this intent exists to reduce, not double. The prose around it stays.                                                                                                                                                                                                                                                                 |
| D8  | The page states plainly that the tree is a point-in-time snapshot.                                                               | _Forced by answers 2 and 5._ Section 05 says "Nothing here is illustrative" four lines above this tree, and that sentence has already been false once — the read-through on 2026-09-13 found the old block wrong in four ways. Shipping known drift under an unqualified claim would repeat the exact failure, louder.                                                                      |
| D9  | `docs/sdlc/` shows **one** example chain, `0002-navigation-usability`, and a count of the rest.                                   | _From the issue,_ verbatim: "do not add all sdlc/ folder entries (just one for example 0002-navigation-usability with its intent,spec,plan)". The count is added so the omission does not read as "there are only two".                                                                                                                                                                    |
| D10 | Every hook, skill, subagent, workflow and top-level config is listed individually.                                               | _From answer 3:_ "every workflow file and top-level config currently shown". This is what kills the `hooks/*.mjs` glob, which was hiding five files behind one line.                                                                                                                                                                                                                       |

## 2. Design

**Data — `site/src/data/repo-tree.json`.** A single array of nodes, each:

```json
{
  "path": ".claude/hooks/guard-bash.mjs",
  "kind": "hook",
  "short": "refuses dangerous shell commands",
  "detail": "Denies force-push, reset --hard, curl piped to a shell, and writes to the default branch. Matches the raw command string, which is why it also refuses prose that quotes those commands."
}
```

`path` carries the nesting — the component derives depth from `/`, so the file has no nested
structure to keep consistent with itself. `kind` drives the colour and the type label.
`short` renders always; `detail` is the `<details>` body and may be absent, in which case the
entry is not collapsible at all rather than collapsing to nothing.

**Component — `site/src/components/RepoTree.astro`.** First component in the project; the
directory does not exist yet. Takes the node array, groups by path depth, emits nested
`<ul>`. Each `<li>` is either a plain row or a `<details>`.

**Injection — `index.astro`.** One more branch beside the existing diagram branch:

```astro
{slug === 'this-repo' && <RepoTree nodes={repoTree} />}
```

**Styling — `site/src/styles/global.css`, scoped under `.repo-tree`.** Connector lines are
`::before` on each `li` (the horizontal stub) and `::after` on each nested `ul` (the vertical
run, stopping at the last child). Colours come from existing tokens; `kind` adds a modifier
class and nothing else. Both colour schemes, as house-style requires.

**Mobile.** Depth indentation shrinks below `40rem` and the type label drops to colour only.
The container scrolls horizontally inside itself if it must; the page body never does.

## 3. Deliberate omissions

- **No automatic sync.** Answer 5. The tree is written by an agent reading the repository and
  is correct on the day it is written. [0049](../0049-generated-repo-tree/intent.md) closes
  this and is already filed. D8 puts the admission on the page rather than in this file only.
- **No icon set.** D5. If the reporter wanted actual pictograms, that is a follow-up and a
  dependency decision, not something to smuggle in here.
- **No animation.** Answer 4 asked for collapsible detail, not motion. `<details>` opens
  instantly, which is also the accessible default.
- **No line count, size, or git history per file.** Derivable, none of it asked for, and all
  of it would go stale faster than the descriptions.

## 4. Risks

| Risk                                                                                                                                                                                                             | Mitigation                                                                                                                                                                                                                                              |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **"Don't make a svg or image" may have meant no vector glyphs at all, or only no static picture of the tree.** D5 reads it the second way and then avoids icons anyway for a different reason (weight, dependency). | Flagged rather than assumed. If the reporter wanted icons, D5 is the row to reject, and rejecting it changes only the markers — not D1–D4.                                                                                                               |
| **The tree goes stale and the page still claims it is literal.**                                                                                                                                                 | D8. This is accepted drift, not an oversight, and the page must say so in the reader's words rather than in a footnote.                                                                                                                                  |
| **A second hand-maintained inventory.** `scripts/diagram/annotations.json` already describes 27 of these same nodes for the pipeline diagram.                                                                     | Not solved here, and worth naming: after this ships, two files describe overlapping sets of repository objects. 0049 should consider consuming `annotations.json` rather than adding a third.                                                            |
| **Page weight.** `bands.yaml` breaches at 512 000 bytes and the built `index.html` is currently 52 867.                                                                                                           | Ten times the headroom for a tree of roughly forty entries with prose. Measured from the local build — the live site did not respond to a transfer-size check while this was written, so the production figure is unconfirmed and the plan should re-check. |
| **`<details>` inside a list can be awkward for screen readers** if the summary is not the whole clickable row.                                                                                                    | Summary wraps the entire row, including the path and short description. Verify with keyboard tabbing before the pull request.                                                                                                                            |
| **Forty entries is a lot of vertical space** in a long-scroll page where this is one section of eleven.                                                                                                           | Collapsed by default is already the answer for `detail`. If the collapsed tree is still too tall, the plan may group by top-level directory — that is a plan-time measurement, not a design decision.                                                    |

## 5. How completion is proven

- `npm run verify` green, both base paths.
- The tree renders with no JavaScript enabled.
- Every hook, skill, subagent and workflow present on disk appears in the tree — checked by
  eye against `ls`, because nothing generates it yet. This is the manual step 0049 removes.
- Readable at 380 px, correct in both colour schemes.
- The drift sentence (D8) is on the page, not only in this spec.
