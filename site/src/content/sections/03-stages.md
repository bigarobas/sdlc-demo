---
slug: stages
title: Six stages, joined by files
stage: the loop
---

The playbook's structure is a loop of six stages, and what connects them is not a tool — it is
a version-controlled artifact. Each stage takes the previous file as input and produces the
next one. A human decides at the boundaries.

| Stage      | Input        | Output             | Who decides                  |
| ---------- | ------------ | ------------------ | ---------------------------- |
| 1 Plan     | an issue     | `intent.md`        | you accept the framing       |
| 2 Design   | `intent.md`  | `spec.md`          | you accept the design        |
| 3 Build    | `spec.md`    | `plan.md` + a diff | you accept the plan          |
| 4 Test     | the diff     | pass or fail       | nobody — it is deterministic |
| 5 Deploy   | a merged PR  | a release          | you approve the gate         |
| 6 Maintain | live metrics | a new `intent.md`  | you triage                   |

Stage 6 producing an `intent.md` is what makes it a loop rather than a pipeline.

The reason to put these in files rather than in a chat is not ceremony. A file can be
reviewed, diffed, linked from a commit, and read by the next session with no memory of this
one. Context that lives only in a conversation dies with it.
