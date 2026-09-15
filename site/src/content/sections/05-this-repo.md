---
slug: this-repo
title: How this site is actually built
stage: implementation
---

Nothing here is illustrative. These files exist, and the page you are reading was deployed by
the workflow described below.

**This listing is generated.** The structure below comes from the repository itself — the same
deriver that produces the pipeline diagram in the next section — and `npm run verify` fails if
it no longer matches what is on disk. Add a workflow without regenerating and the build turns
red. The one-line descriptions are written by a person; an assertion requires every file to
have one, which is not the same as checking that it is right.

That distinction is not pedantry. This block used to be typed by hand, and a read-through
found it wrong four ways at once — three workflows missing, a skill missing, a count derived
from the missing workflows, and two shipped cycles it did not show — while the build stayed
green and every check passed. The sentence at the top of this section was false for several
weeks and nothing noticed.

Seven of the ten workflows spend no tokens at all. That is deliberate: the stages that must
never fail for quota reasons are the stages that do not consume quota.

The first two are a pair, and the split is worth a sentence. `checks.yml` runs on every
change and builds nothing — four seconds of formatting, evals and diagram drift. `verify.yml`
builds the site and fires only on paths that could change the built output. Editing a spec
should not deploy a website.

**One correction, because it is the kind of detail that quietly turns a claim into a lie.**
The audit log was originally committed, as an artifact you could browse here. It is not any
more. A hook appends to it on every agent write, which leaves the working tree permanently
dirty and makes `git checkout` refuse to switch branches — three sessions lost time to that
before the cost was obvious. Git's `union` merge driver fixed the merge conflicts but not the
dirty tree, so the file is now local only.

The log still exists, and it is still the live record of what the agent touched. It just
isn't in the repository, so this page no longer says that it is.
