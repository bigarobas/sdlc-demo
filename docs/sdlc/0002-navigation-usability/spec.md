# Spec 0002 — Section navigation

Implements [intent.md](./intent.md).

Produced by `/sdlc --auto`, so nobody read this before the plan was built on it. The
decisions below were checked against one test: can each be answered from the intent's own
Proposed outcome, the `house-style` skill, or the code as it stands — rather than invented?
Each row says which.

## 1. Guiding decisions

| #   | Decision | Why, and where it comes from |
| --- | --- | --- |
| D1 | Desktop nav goes from `15rem` to `20rem`, and its text from `--step--1` to `--step-0`. | *From the outcome:* "at least twice as large" with "larger text". Twice 15rem would be 30rem — a third of a 90rem screen for a table of contents — so this reads the request as "noticeably bigger", not as arithmetic. The type step is the site's existing body size; introducing a new size would mean a scale with five steps and no rule. |
| D2 | The number moves into its own grid column rather than sitting an `em` away from the title. | *From the outcome:* "clearer separation between section numbers and titles". A gap is separation you can lose; a column is separation you cannot. It also makes the numbers align, which a flex gap never did. |
| D3 | The mobile control is a **labelled button reading "Sections"**, not a hamburger icon. | *From house-style:* plain, specific, no decoration. A word needs no learning and no `aria-label` to explain it. The intent asked only for "a simple menu button" and left the form open. |
| D4 | When collapsed, the mobile bar shows **the current section** — its number and title. | *From the outcome:* "can tell which section of the page they're in without having to scroll back to the nav". The scrollspy already computes this; the indicator is a second reader of existing state, not a new mechanism. This is the one open question with three plausible readings, and the outcome sentence is what narrows it. |
| D5 | The breakpoint stays `60rem`. | *From the code:* it is already the site's desktop boundary. A second breakpoint would mean two answers to "is this mobile" and a class of bug where they disagree. |
| D6 | The menu is collapsed by default on mobile, expanded always on desktop, and the toggle is JavaScript. | *From the constraint* "keep the fix simple". A `<details>` element would survive without JavaScript but needs fighting to stay open above the breakpoint. See the omission below for what that costs. |
| D7 | No icon set, no new dependency. | *From house-style,* and from a 45 kB page that should not gain a font to draw a triangle. |

## 2. Design

**Desktop, ≥60rem.** The sidebar widens to `20rem`. Each entry becomes a two-column grid:
a fixed monospace number column, then the title. Text at `--step-0`. The current section keeps
its `aria-current` treatment.

**Mobile, <60rem.** The nav becomes a bar with two parts:

```
┌─────────────────────────────────────────┐
│  04 · Four mechanisms…      [ Sections ]│   collapsed (default)
└─────────────────────────────────────────┘
```

Tapping **Sections** expands the full list beneath it; tapping again collapses it. Choosing an
entry collapses it too — a menu that stays open over the thing you just navigated to is a menu
you have to dismiss twice.

The left side shows the current section, updated by the same `IntersectionObserver` that
drives the desktop highlight. Before any section is current it shows the site title, so the
bar is never empty.

## 3. Deliberate omissions

- **No no-JavaScript fallback for the mobile menu.** With JavaScript off the list stays
  collapsed and unreachable. This is acceptable here and would not be on most sites: the page
  is one continuous scroll, every section is in the document, and the nav is a shortcut rather
  than the only route. `<details>` would have avoided it at the cost of fighting the element to
  stay open on desktop, and the intent asked for simple.
- **No animation.** A menu that takes 200ms to appear is slower than one that appears.
- **No scroll-spy change.** The desktop behaviour is untouched; the mobile bar reads the state
  it already produces.

## 4. Risks

| Risk | Mitigation |
| --- | --- |
| A 20rem sidebar squeezes the content column on a laptop | The content is capped at `68ch` and centred in what remains; at 1280px there is room for both. Check at 1280 and 1440 before merging. |
| The current-section label overflows on a narrow phone | It truncates with an ellipsis and the number stays visible, which is the part that locates you. |
| The bar and the expanded list disagree about the current section | They cannot: one observer, one piece of state, two readers. |
| `--auto` produced this spec unreviewed | The whole point of the preview URL on this pull request. The nav is the most visible thing on the site; a wrong call here is obvious rather than subtle. |
