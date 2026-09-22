# Spec 0079 — Technical summary, and a diary behind a fold

Implements [intent.md](./intent.md).

Written as a single stage, not by `--auto`. The four answers on the intent turn this into the
largest rewrite the site has had, and one of them puts the intent in direct tension with the
`house-style` skill. That tension is section 4, and it is the part worth reading first.

## 1. Guiding decisions

| #   | Decision | Why, and where it comes from |
| --- | --- | --- |
| D1 | The diary lives in a **second file per section**: `09-scars.md` and `09-scars.diary.md`. | _From the code._ Sections are plain `.md` rendered through `<Content />`, which compiles the whole file — there is no seam to split a rendered component on. Two files is the only mechanism that needs no new content format. |
| D2 | A diary file is **optional**. No file, no disclosure. | _From answer 1:_ the rule is "everything that doesn't help understanding the implementation". Some sections have nothing that qualifies. Forcing an empty diary onto `05a-pipeline.md` would be structure for its own sake. |
| D3 | The disclosure is native `<details>`/`<summary>`, collapsed by default. | _From answer 2:_ "a content that the user can open/close and makes the default read simpler". Precedent in `RepoTree.astro`, no JavaScript, keyboard-accessible, findable by in-page search in most browsers. |
| D4 | One diary per section, at the end — not per paragraph. | _From answer 2:_ "only the user that wants to know more will open a collapsed diary entry". Per-paragraph folds would make the fast pass a field of buttons, which is the opposite of simpler. |
| D5 | The summary line names what is inside, specifically. | "Diary" alone tells a reader nothing about whether to open it. `What broke, and what it cost` is a reason to click; a generic label is furniture. |
| D6 | Existing prose is **moved**, not rewritten. | _From answer 4:_ "it should replace the current prose". Moving preserves sentences that took a week to get right and keeps the diff reviewable — a rewrite would make it impossible to tell what changed from what was reworded. |
| D7 | The technical layer is what remains after the move, edited only for continuity. | Same answer. If a paragraph needs inventing to replace what left, that is a signal the material was not diary in the first place. |
| D8 | Sections are converted **one per pull request**, not all eleven at once. | _From answer 3:_ both existing and new content follow this — but eleven sections in one diff is unreviewable, and the judgement in D9 is exactly the kind that needs looking at. The first one converted is the test of whether the rule works. |
| D9 | The dividing rule, stated so it can be applied: **a sentence belongs in the diary if deleting it would not change what a reader must do or know to build the same thing.** | _From answer 1,_ made operational. "The hook denies writes to `.github/workflows/**`" is technical. "That is not the model choosing to respect a rule" is diary. The rule will not settle every paragraph, which is why D8 exists. |

## 2. Design

**Content.** For each converted section, a sibling file:

```
site/src/content/sections/09-scars.md          the technical layer
site/src/content/sections/09-scars.diary.md    what moved
```

The diary file carries frontmatter with one field, `summary` — the text of the `<summary>`
element per D5.

**Loading — `index.astro`.** The existing glob is `../content/sections/*.md`, which would pick
up `.diary.md` as sections in their own right. It becomes two globs: sections excluding
`.diary.md`, and diaries keyed by slug.

**Rendering.** After each section's `<Content />`:

```astro
{diary && (
  <details class="diary">
    <summary>{diary.frontmatter.summary}</summary>
    <diary.Content />
  </details>
)}
```

**Styling — `global.css`, scoped under `.diary`.** Visually quieter than the section body:
muted text, a left rule, the existing tokens. It must read as an aside rather than as a second
article.

## 3. Deliberate omissions

- **No per-paragraph folds.** D4.
- **No "expand all".** A control for a thing the page has eleven of, each one line.
- **No change to the nav.** Diaries are not sections and do not get numbers or scroll-spy
  entries.
- **Nothing is deleted.** Everything that moves, moves. If a paragraph is not worth keeping,
  that is a separate editorial decision and not this intent's.

## 4. The risk that matters, and it is not a technical one

**This intent and the `house-style` skill disagree, and the spec cannot resolve it alone.**

House style says:

> Say what broke. The bugs found while building this are more persuasive than the successes.

And the site's own argument is that the honest version beats the impressive-sounding one. The
material this intent moves behind a fold is precisely the honest version: the five declined
merges, the `settings.local.json` door, the fifty-eight review runs that produced two comments,
the seventeen-hour deploy freeze.

A reader doing the fast pass would get a competent, neutral technical site — which is what
every other project's documentation already looks like, and is the thing this site is trying
not to be.

Both readings are defensible:

- **The intent's:** a reader who wants the facts should not have to read the reflection first.
  Nothing is lost — it is one click away, and a reader who wants it will click.
- **The counter:** nobody clicks. Collapsed content is unread content, and the argument that
  makes this site worth looking at would be optional.

**Decided by the operator on 2026-09-22, in favour of the intent:**

> nothing is lost because it's one click away

So the work proceeds. Recorded here rather than in a conversation, because this is the
decision every later section inherits, and someone converting section 07 in a month should be
able to see that it was taken deliberately and on what grounds — not infer it from the fact
that somebody did it.

**What that decision commits to, and what it does not.** It accepts that the diary is one
click from the fast pass. It does not accept that the diary can become a place things are put
to get them off the page. If a paragraph is worth keeping it is worth a summary line that
makes someone open it, which is what D5 is for — and if converting a section leaves a
technical layer nobody would bother reading, that is evidence against the rule rather than a
section done correctly.

D8 still stands, for a narrower reason than before. It was written so the tension above could
be settled on evidence; that is settled. What remains is whether **D9 actually divides prose
cleanly**, which is a different question and still unanswered. `09-scars.md` is the right first
section for it — almost entirely diary by D9, so it is the hardest case and will show fastest
whether the rule produces two readable halves or one good one and one husk.

## 5. Other risks

| Risk | Mitigation |
| --- | --- |
| **Section 09 has no technical layer left.** By D9 it is a list of bug one-liners with every "why it mattered" removed. | That is the finding, not a failure. If converting it leaves nothing worth reading, the rule is wrong for that section and the spec should be amended before the other ten. |
| **The glob change silently renders diaries as sections.** `*.md` matches `*.diary.md`. | An eval: the section count is what the nav renders, and it must not change when a diary file is added. Cheap, structural, and this is exactly the failure that would ship green. |
| **The `<summary>` becomes generic over time** — eleven sections all saying "Diary". | D5, plus the eval could assert no two summaries are identical. Flagged; probably not worth the check. |
| **Reviewing a moved paragraph is hard** if it is also reworded. | D6: move first, edit continuity separately, so the diff shows the shape change rather than the shape change plus a rewrite. |

## 6. How completion is proven

Per section converted:

- `npm run verify` green at both bases.
- The nav still lists eleven sections, and no diary appears as one.
- The page renders and the diary opens **with JavaScript disabled**.
- The fast pass — reading only the unfolded text — still makes sense on its own.
- The diary reads as an aside, not as a second article, at 380 px and in both colour schemes.
