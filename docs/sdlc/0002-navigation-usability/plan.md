# Plan 0002 — Section navigation

Implements [spec.md](./spec.md).

Three files, no new dependency, no change to how sections are authored.

## Order of work

**1. `site/src/layouts/Base.astro` — markup.** The nav gains a bar above the list: a
current-section label and a `Sections` button. The list keeps its existing `<ol>` and
`data-nav-for` links untouched, because the scrollspy already targets them.

The button carries `aria-expanded` and `aria-controls`; the list gets an `id`. That is not
decoration — a button whose only state is a CSS class is invisible to anything that is not
looking at pixels.

**2. `site/src/styles/global.css` — the two layouts.**

- Desktop ≥60rem: grid column `15rem` → `20rem`; nav text to `--step-0`; each link becomes
  `grid-template-columns: 2.25rem 1fr` so the numbers align; the bar and button are hidden.
- Below 60rem: the bar shows, the list is hidden unless `data-open`, and the horizontal
  scrolling strip is gone.

**3. `site/src/layouts/Base.astro` — behaviour.** Extend the existing script rather than
adding a second one:

- toggle `data-open` and `aria-expanded` on click
- collapse when an entry is chosen
- write the current section's number and title into the bar from the observer that already
  computes it — one piece of state, two readers (spec D4)

## How completion is proven

Before the pull request:

- `npm run verify` passes — evals, links, diagram, both base paths
- at 1280px and 1440px: the sidebar is 20rem, numbers align in their own column, the content
  column is not squeezed (spec risk 1)
- at 380px: the bar shows the current section, the button opens and closes the list, choosing
  an entry closes it, and the page does not scroll sideways
- scrolling updates both the desktop highlight and the mobile label from the same state

On the preview, before merging — the reason this pull request has a preview at all:

- the nav is genuinely more usable at a glance, which is a judgement the person who filed the
  issue has to make and I cannot

## Risks

| Risk | Handling |
| --- | --- |
| The mobile menu needs JavaScript (spec D6) | Stated as a deliberate omission. Every section is still in the document and reachable by scrolling. |
| Widening the sidebar squeezes the content | Checked at two widths before the pull request. |
| The bar label is empty before the first section is current | Falls back to the site title. |
| `--auto` wrote spec and plan unreviewed | Both are in this pull request, so they are reviewed together with the diff rather than not at all. |

## Not in this plan

The nav's *contents* — which sections exist, their order, their titles — are untouched. This is
a change to how the list is presented, nothing else.
