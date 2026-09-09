# Review policy

What the agentic review pass looks for, and what each severity means. Referenced by
`.github/workflows/agent-review.yml`.

The point of writing this down is that a review with no stated policy drifts: the same
change gets a different verdict depending on what the model happened to notice. A policy
also makes it fair to ignore a finding — if it is not in scope here, it is not blocking.

## Severities

| Severity | Meaning | Effect |
|---|---|---|
| **blocking** | The change is wrong, unsafe, or claims something untrue | Do not merge |
| **should-fix** | Correct but will cause avoidable trouble later | Merge only with a follow-up issue |
| **note** | Worth knowing, not worth blocking on | Comment, no action required |

## In scope

**Correctness**
- Absolute asset paths. Both deploy targets are subfolders; `/x.svg` 404s in both. *blocking*
- Anything that only works at base `/`. *blocking*
- Shell chaining (`&&`) in npm scripts, hooks or docs — Windows PowerShell 5.1 cannot run it. *blocking*
- Links that the link checker cannot reach because they are generated at runtime. *should-fix*

**Honesty** — this repository argues for it, so it is reviewed for
- A shell described as if it were complete. *blocking*
- A claim on the site that the repository does not actually do. *blocking*
- A PR body describing unverified work as verified. *blocking*
- Marketing register in prose. *note*

**Governance**
- Any attempt to widen what an agent may do without a human commit. *blocking*
- New CI agent jobs, or removal of `--max-turns` / `timeout-minutes` / `concurrency`,
  since CI bills the same Pro quota as interactive work. *blocking*
- Credentials referenced outside the `production` environment. *blocking*

**Quality**
- A second way to do something the repo already does. *should-fix*
- Abstractions with a single caller. *note*
- Comments restating the code. *note*

## Out of scope

- Style and formatting. A hook handles it; do not spend review on it.
- Test coverage percentages. This is a static site — coverage is a bad proxy here.
- Performance micro-optimisation. The control band on page weight is the only budget.
- Rewriting decisions already recorded in a spec. To disagree with D<n>, open an intent.

## For the reviewing agent

- Report at most five findings, most severe first. A long list gets skimmed and nothing
  gets fixed.
- Quote the actual line. Do not paraphrase code.
- State the failure scenario concretely: the input, and what goes wrong. If you cannot
  describe one, it is a *note* at most.
- Say when you found nothing. Silence reads as a broken workflow.
- You are one input to a human decision, not the gate. The gate is a person clicking
  approve on the `production` environment.
