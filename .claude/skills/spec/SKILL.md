---
name: spec
description: Stage 2 (Design). Turn an accepted docs/sdlc/NNNN-slug/intent.md into a spec.md that records numbered design decisions and their reasons. Use after an intent is accepted and before writing any implementation plan or code.
---

# Writing a spec

The spec answers *how*, and more importantly *why this way*. Its most valuable output is not
the design — it is the numbered decisions, because those are what later work cites when it
needs to diverge.

## Steps

1. Read the intent. If it is not `accepted`, stop and say so.
2. Read `AGENTS.md` for existing conventions, and the specs of neighbouring work for
   decisions you should inherit rather than re-litigate.
3. Write `docs/sdlc/NNNN-slug/spec.md`, linking the intent on the first line.
4. Flag concerns rather than smoothing them over. A spec that raises no risks has not been
   thought about.
5. Stop. A human accepts the spec before Stage 3.

## Template

```markdown
# Spec NNNN — <short title>

Implements [intent.md](./intent.md).

## 1. Guiding decisions

| # | Decision | Why |
|---|---|---|
| D1 | … | … |

## 2. Design

Structure, files, data flow. Enough that the plan can name specific files.

## 3. Deliberate omissions

What is knowingly not built, and why. Shells are named as shells here.

## 4. Risks

| Risk | Mitigation |
|---|---|
```

## Rules

- Every decision gets a number and a reason. "Why" is not "because it is standard" — say
  what would break under the alternative.
- Cost is a design constraint, not an afterthought. If a choice burns tokens, quota or money,
  the decision row says so.
- Prefer the boring option, and say that you preferred it. Novelty needs a justification;
  convention does not.
- When you supersede an earlier decision, edit the row and note what changed. Do not leave
  two contradictory decisions in the repository.
- Name what you are *not* building. The omissions section is what keeps a demo honest.
