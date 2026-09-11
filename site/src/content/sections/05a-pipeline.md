---
slug: pipeline
title: The whole pipeline, generated
stage: architecture
---

This diagram is not drawn. It is **derived** — every box below comes from a file that has to
exist for the pipeline to work: the workflows and their triggers, the hooks registered in
`settings.json`, the skills, the subagents, `bands.yaml`. Nothing is a hand-kept list.

Then `npm run verify` regenerates it and fails if the committed version differs, exactly as
it fails on unformatted code. **A diagram that is maintained goes stale; a diagram that is
generated cannot.** Add a workflow without regenerating, and the build turns red.

Only one thing is written by hand, in `annotations.json`: what a repository cannot state
about itself — which stage a thing belongs to, whether it costs quota, and which node is a
gate. An assertion requires every derived node to have an entry, so adding a workflow forces
someone to say what it is for before CI will pass.
