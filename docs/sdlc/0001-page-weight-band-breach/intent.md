# Intent 0001 — Page-weight control band breached on the live site

- **Status:** draft
- **Author:** Claude (from GitHub issue #8)
- **Date:** 2026-09-10

## Problem

The `page_weight` control band, checked automatically against the production site at
`https://rashid.fr/sdlc/`, breached its budget. The check that opened this intent (from
`.github/workflows/bands.yml`, no model involved) recorded, at 2026-09-10T14:19:55.448Z:

- ok · **availability** — HTTP 200 from `https://rashid.fr/sdlc/`
- BREACH · **page_weight** — 23.4 kB against a budget of 0.1 kB
- ok · **build_time** — 31s against a budget of 180s

This is [GitHub issue #8](https://github.com/bigarobas/sdlc-demo/issues/8) in
`bigarobas/sdlc-demo`, opened automatically and labelled `control-band, intent`.

Note: the budget the issue reports for `page_weight` (0.1 kB) does not match the
`max: 512000` (500 KB) configured for `page_weight` in this repo's `bands.yaml` at the
time of writing. Whether the issue's reported number, `bands.yaml`, or something else
is stale or wrong is not something this intent resolves — see Open questions.

## Proposed outcome

The `page_weight` band is back within whatever limit is deliberately set for it in
`bands.yaml`, or the limit itself is changed and the reason for the change is recorded —
per the issue's own stated proposed outcome. Someone reading `bands.yaml` and the live
site afterward can tell whether the band is healthy and why the current threshold is
the right one.

## Affected systems

- The published site at `https://rashid.fr/sdlc/`.
- `bands.yaml` (the threshold definition).
- `.github/workflows/bands.yml` (the check that measures and opens issues on breach).
- Whatever in the site's build or content produced the page-weight change being measured.

## Constraints

- Severity: medium, per the issue.
- `bands.yaml` is the sole source of truth for thresholds; this issue was opened by
  `.github/workflows/bands.yml` with no model involved, per the issue.

## Open questions

- Is the `page_weight` threshold wrong, or is the site wrong? (asked verbatim in the
  source issue; a human must decide which.)
- The issue states the `page_weight` budget as 0.1 kB, but `bands.yaml` currently
  configures `page_weight.max: 512000` (500 KB). A human should confirm which number is
  authoritative before Stage 2 proceeds — it changes whether 23.4 kB is even a breach.
- No other instructions, commands, or configuration changes were requested by the issue
  text itself; the issue body is a standard automated control-band report with no
  attempt to direct this agent beyond describing the breach.
