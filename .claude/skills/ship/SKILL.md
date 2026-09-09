---
name: ship
description: Stage 5 (Deploy). Open a pull request for finished work — verified, described against its SDLC artifacts, and ready for human review. Use once an implementation is complete and npm run verify passes.
---

# Shipping

A PR is a request for a human decision. It should make that decision cheap to make and
hard to make wrongly.

## Before opening anything

1. `npm run verify` passes. Use the `verifier` subagent. **Do not open a PR on red**, and do
   not describe failing work as done.
2. Run the `simplifier` subagent. Removing code is part of finishing it.
3. The artifact chain is complete: `intent.md`, `spec.md`, `plan.md` all exist and link
   backwards. If you skipped one, write it now.
4. You are on a branch. Pushing to `main` is blocked by a hook, and rightly.

## The pull request body

```markdown
## What

One paragraph. What changes for a person using the site.

## Why

Link the intent and the spec. Cite the decision numbers this implements (D3, D7).

## Verification

What `npm run verify` covered, and what it did not. Name the gaps.

## Review focus

Where you are least confident. Point the reviewer at the risky part rather than
letting them find it.

## Deploy

What happens on merge, and which gate it stops at.
```

## Rules

- Report what actually happened. If a test was skipped, say it was skipped. If something
  works but you do not know why, say that — it is the most useful sentence in a PR.
- Never describe a shell as if it were complete.
- Keep the diff to one intent. If you fixed something unrelated on the way, say so
  explicitly, or leave it out.
- The reviewer is the only human in this loop. Assume they will read the PR body and skim
  the diff, and write accordingly.
- After opening the PR, stop. Merging and approving deploys are human actions, and the
  production credential is not available to you by design.
