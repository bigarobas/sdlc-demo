# Plan 0079 — Convert one section

Implements [spec.md](./spec.md), from [intent.md](./intent.md).

Produced by `--auto` alongside the implementation, so the plan was not read before the code
was written against it. The spec's decisions were all settled first, including the section-4
tension, which is why `--auto` is defensible here — the remaining judgement is in applying D9
to paragraphs, and that is reviewed on the preview rather than in this file.

## Scope: `09-scars.md` and nothing else

Per D8. Per section 4, the hardest case, chosen deliberately: it is almost entirely diary by
D9, so if the rule produces a husk this is where it shows.

## Files

| File                                             | Change                                              |
| ------------------------------------------------ | --------------------------------------------------- |
| `site/src/content/sections/09-scars.md`          | keeps the facts; the reflection leaves               |
| `site/src/content/sections/09-scars.diary.md`    | new — what left, plus a `summary` frontmatter field |
| `site/src/pages/index.astro`                     | two globs instead of one; render the disclosure      |
| `site/src/styles/global.css`                     | `.diary` block, quieter than the body                |
| `evals/run.mjs`                                  | a diary file must not render as a section            |

**Infrastructure and the first conversion ship together**, deliberately. Reverting one pull
request is simpler than reverting half of one, and there is no value in the loader being on
`main` if the rule turns out to be wrong.

## Order of work

1. **The glob**, first and on its own. `import.meta.glob('../content/sections/*.md')` matches
   `*.diary.md`, so adding one file would silently produce a twelfth section. Fix it, then add
   the eval that holds it.
2. **Split `09-scars.md`** by D9. Move, do not rewrite (D6) — so the diff shows the shape
   change rather than a shape change plus a reword.
3. **Render and style** the disclosure.
4. `npm run verify` at both bases.
5. **Read the fast pass.** Stop here and report if the technical layer is a husk.

## The stop condition, stated before starting

The spec says a conversion that leaves a technical layer nobody would read is **evidence
against the rule, not a section done correctly**.

For this section the risk is concrete: strip every "why it mattered" clause from 09 and what
remains is a list of bug one-liners. That may be a good reference — the same material
`AGENTS.md` carries as its mistakes list — or it may be a husk that only made sense with its
reflection attached.

If it is a husk, this pull request reports that instead of shipping it. Shipping it anyway
would be manufacturing agreement that the rule works, which is the one thing `--auto` must not
do.

## Risks

| Risk                                                                                     | What the plan does                                                                                                                              |
| ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **A diary file renders as a twelfth section.** `*.md` matches `*.diary.md`.              | Step 1, before any content moves, plus an eval so it cannot come back. This is a failure that would ship green, which is this repository's shape. |
| **The technical layer is a husk.**                                                        | The stop condition above. It is the point of converting this section first.                                                                     |
| **The diary reads as a second article** rather than an aside.                             | Styling is quieter than the body — muted, ruled, same tokens. Checked at 380 px and in both colour schemes.                                      |
| **Moving and rewording in one diff** makes the change unreviewable.                       | D6. Sentences move intact; continuity edits are visible as the small separate things they are.                                                   |
| **The `<details>` is inaccessible or needs JavaScript.**                                  | Native element, precedent in `RepoTree.astro`. Verified with JavaScript disabled.                                                               |

## How completion is proven

- `npm run verify` green at `/sdlc/` and at a preview base.
- The nav lists **eleven** sections; no diary among them.
- The diary opens with JavaScript disabled.
- The fast pass — section 09 with the disclosure shut — reads as something worth having.
- Readable at 380 px, correct in both colour schemes.

## Cost

One cycle. No new dependency, no workflow, no credential. The eval is structural and free.
