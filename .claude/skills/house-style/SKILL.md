---
name: house-style
description: The design and prose constraints for the sdlc-demo site. Use whenever writing or editing anything under site/ — pages, components, styles, or copy — so the result matches the existing system instead of introducing a new one.
---

# House style

Institutional knowledge applied as a constraint, not a prompt someone retypes. This is the
static-site equivalent of the playbook's `secure-api-review` example: the rules exist so that
work done in a fresh context still comes out looking like the same site.

## The argument the design has to carry

The site claims that the honest version of a thing beats the impressive-sounding version.
A design that oversells would contradict its own content. Restraint here is not taste, it is
consistency with the argument.

## Layout

- **Long-scroll, one section per topic, sticky section nav.** No keyboard deck navigation,
  no scroll-jacking, no slide transitions. It is read after the talk more than during it.
- Content column caps at `68ch`. Code blocks and tables may exceed it and scroll inside
  their own `overflow-x: auto` container. The page body never scrolls horizontally.
- Every section has a stable `id` and is linkable. The talk jumps around; the URLs must too.

## Tokens

Define the light palette on bare `:root`, redefine only what changes under
`@media (prefers-color-scheme: dark)`. Never give a colour its only definition inside a
media query. Give `body` an explicit background.

- Two typefaces at most: one for prose, one monospace for code. System stacks are fine and
  need no network request.
- One accent colour. It marks the SDLC stage a section belongs to, and nothing else.
- Type scale in `rem`, four steps. Body text at least `1.0625rem`.

## Assets

**Never write an absolute asset path.** Both deploy targets live in a subfolder, so `/x.svg`
404s in production and preview alike. Always `import.meta.env.BASE_URL`. This has already
broken once.

## Prose

- Plain, specific, present tense. No marketing register, no "unlock", no "seamless".
- Prefer the concrete number to the adjective: "14 assertions, zero tokens", not
  "comprehensive testing".
- **Label shells as shells**, in the section where they appear, not only in a footnote.
- Show the real thing — a real denial message, a real workflow file — rather than a
  paraphrase of it. The evidence is the point.
- Say what broke. The bugs found while building this are more persuasive than the successes.

## Components

Before adding a component, check `site/src/components/` for one that nearly fits and widen
it. A site this small does not need two ways to draw a box.

Each new component needs: a stable id if it is a section, sensible behaviour at 380px wide,
and correct rendering in both colour schemes.
