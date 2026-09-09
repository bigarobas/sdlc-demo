# Intent 0000 — Bootstrap: a self-documenting AI-native SDLC

- **Status:** accepted
- **Author:** Rashid Ghassempouri
- **Date:** 2026-09-09

## Problem

I want to show colleagues what an AI-native SDLC actually looks like. They already use
Cursor and Claude in "plan then implement" mode. Slides describing an autonomous loop
would not convince them — they would correctly ask whether any of it runs.

## Proposed outcome

A static website that explains the AI-native SDLC, built *by* the SDLC it describes, in
a public repo they can read. The repo's own `.claude/` directory, hooks, workflows and
artifact chain are the evidence. During a 30-minute talk on 2026-09-23 I run one full
cycle live: issue in, agent PR out, human approval, production deploy.

## Affected systems

GitHub (public repo, Actions, Pages, Environments), an owned domain served over FTP,
a free Slack workspace (notifications), Claude Pro (interactive + CI via OAuth token).

## Constraints

- **Deadline:** demo-ready 2026-09-16, talk 2026-09-23. Roughly five evenings of work.
- **Budget:** Claude Pro only. CI agents bill against the *same* weekly quota as the
  terminal, so agent jobs in CI must be few and hard-capped.
- **Runtime:** the FTP host serves static files only — no Node, no server.
- **Portability:** colleagues use Cursor. Configuration must not be Claude-only where
  avoiding it is cheap.
- **Honesty:** anything implemented as an empty shell is labelled as a shell on the site.

## Resolved

- Repo: `sdlc-demo`, public. Production URL: `https://rashid.fr/sdlc/` (a subfolder, so the
  production build needs `base: '/sdlc/'` — not root).
- Live-cycle feature: a small, visible cosmetic change (see spec §9).
- Long-scroll with a sticky section nav. No keyboard deck navigation: it is JavaScript to
  debug on stage for no argumentative gain, and long-scroll reads better afterwards, when
  the site stops being a talk and becomes a reference.
