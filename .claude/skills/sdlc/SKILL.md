---
name: sdlc
description: Move a piece of work to its next SDLC stage. Use when asked to continue, advance or run an intent — "/sdlc 0000-bootstrap", "carry on with the bootstrap intent", "what is the next step for that intent". Reports where the work is and what a human must do next.
---

# Running the cycle

One stage per invocation, unless `--auto` is given. The stages and their artifacts are in
`AGENTS.md`; this skill is only about knowing which one is next and doing that one properly.

## Always start by looking

```
npm run intents
```

That is a script, not a judgement call: it prints every intent, its status, which artifacts
exist, and any open pull request. Trust it over memory — the repository may have moved since
this session started.

If the requested id does not appear, say so and stop. Do not invent an intent directory, and
do not refer to one in conversation either — an id exists only once the drafting agent has
created its directory, and the number is whichever is next unused. Quoting a plausible id that
does not exist sends someone looking for a thing that was never there.

## The stages

| State                      | Do                                                                                      |
| -------------------------- | --------------------------------------------------------------------------------------- |
| No `intent.md`             | Stop. An intent comes from an issue via `agent-intent.yml`, or from the `intent` skill. |
| `Status: draft`            | **Stop and ask.** Accepting an intent is a human decision.                              |
| Accepted, no `spec.md`     | Apply the `spec` skill. One file, one PR.                                               |
| `spec.md`, no `plan.md`    | Write `plan.md`: files, order of work, risks, and how completion will be proven.        |
| `plan.md` exists           | Implement it.                                                                           |
| Everything exists, PR open | Report the PR and what it needs. Do not merge.                                          |

## Rules

- **Never advance past an unaccepted artifact** — without `--auto`. Building a plan on a spec
  nobody read means discovering a wrong framing after paying for the implementation. The
  acceptance steps are the cheap place to be wrong. `--auto` is the operator saying they
  accept that trade for this one piece of work; see below.
- **Never merge, never approve, never deploy.** Those are human acts, and two of them are
  structurally impossible anyway — `CODEOWNERS` prevents self-approval and the `production`
  environment holds the credential. Report the commands instead of attempting them.
- **`npm run verify` passes before any PR.** Prefer the `verifier` subagent so build output
  stays out of this context.
- Adding a skill, hook, workflow or agent changes the generated diagram. Run `npm run diagram`
  and annotate the new node, or `verify` fails on drift.

## What to report when a stage finishes

Short, and in this order:

1. What was produced, and the one thing you were least sure about.
2. What a human must do next, **with the exact commands** — squash merges need `--admin`
   because the author cannot approve their own pull request.
3. What happens after that, so the next step is not a surprise.

## `--auto`

Runs every remaining agent stage and opens **one** pull request containing the artifacts and
the diff together, rather than pausing between them.

It removes conversational pauses. It does not remove gates, and it cannot: the merge and the
deployment are still human, still logged, still enforced by machinery this skill has no access
to.

**`--auto` may accept a draft intent**, and should, as its first action.

Naming an intent and asking for `--auto` _is_ the agreement that the framing is right. Making
someone merge a drafting pull request and then merge a one-line acceptance is the same
decision collected twice. The gate exists so a human agrees before work is built on the
framing, and that agreement has been given.

What must not disappear is the record. Accept it in **its own commit**, and say in the message
that it was accepted by `--auto` on explicit instruction rather than read and accepted
separately. A reviewer can then tell the two apart, which is the only thing the extra merge
was really buying.

Stop immediately, whatever `--auto` says, if:

- the intent is **superseded**, or has no `intent.md` at all — there is nothing to agree to;
- `npm run verify` fails — never open a red pull request;
- the spec would have to invent a decision the intent left as an open question. That is the
  real limit: `--auto` may compress agreement, never manufacture it.

Say plainly, in the pull request body, that the intent was accepted by `--auto`, and that the
spec and plan were produced without anyone reading the spec before the plan was built on it.
The reviewer is looking at three decisions in one diff and should know it.

**When not to use it.** A small design space and a cheap mistake — a cosmetic change, a copy
edit. Not when the spec has real choices in it: on intent 0001 the spec contained a mitigation
that did not work, and catching it at plan time cost nothing, whereas `--auto` would have
carried it into the implementation.
