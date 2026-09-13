# Intent 0004 — you cannot tell what a preview is relative to production

- **Status:** draft
- **Author:** Rashid Ghassempouri
- **Date:** 2026-09-13

## Problem

Intent 0001 put a build stamp in the footer, and it works: every page says which environment
it is, which commit it came from, and when it was built. On 2026-09-13 the two live footers
read:

```
preview      31d8283      #43     2026-09-12 22:32 UTC
production   8431f21              2026-09-12 22:40 UTC
```

Looking at those side by side, there is no way to answer the only question anyone asks of a
preview: **is this the same site as production, and if not, how does it differ?**

It is worse than unanswerable. The two identifiers are not comparable even in principle:

- **The preview stamp names a commit that exists nowhere you can reach.** On a `pull_request`
  event `GITHUB_SHA` is the merge commit GitHub synthesises at `refs/pull/N/merge`. `31d8283`
  turns out to be *"Merge aae646a into fb0d3e3"* — it is on no branch, it needs a PR-ref fetch
  to inspect, and it names neither the work under review nor anything to compare it against.
  It is the one commit in the system that answers no question.
- **The preview was built on a base that production had already moved past.** That merge's
  base is `fb0d3e3`; production is serving `8431f21`, which landed nine minutes later. Nothing
  on either page says so.
- **The pull request comment states this as a fact and is wrong.** It says the preview is
  *"this pull request merged into main, which is what it will look like after merging"*. True
  when the preview builds, false the moment main moves, and nothing re-checks it.

Two footers agreeing on a SHA would prove nothing either, because a preview and a production
build of identical content produce different SHAs by construction.

### The stale base is not only a provenance problem

Written above as a third way the footers mislead. Hours later it produced a wrong result,
which reframes it.

The Slack notification for the same preview arrived without a link card, while the production
one unfurled correctly — both workflows having been given `unfurl_links: true`. The run log
shows why. The payload the preview actually sent was:

```
'{text: ("Preview ready for #" + $n + " — " + $t + "\nhttps://rashid.fr/sdlc-preview/")}'
```

No `unfurl_links`. It ran a version of `preview.yml` that no longer exists on `main`.

The commit order explains it. `fb0d3e3` merged the proposals; `8431f21` installed them into
`.github/workflows/`. The pull request's branch was cut from `fb0d3e3`, so its merge ref
carries the pre-fix workflow, and a `pull_request` event runs the workflow from that merge
ref. The preview was built _and announced_ by a file that had already been replaced.

Nothing anywhere reported this. The run was green, the preview published, the notification
sent, and the only symptom was a missing link card that looked like a Slack problem and cost
an hour to trace to the right file.

So a stale base is not only "the footer cannot tell you what you are looking at". It is **the
preview can be built, published and announced by superseded machinery, silently**. The
consequence here was cosmetic. The same mechanism applies to the verification step, the base
path and the FTP target, where it would not be.

That does not change what this intent asks for — a value that says whether two builds are the
same site. It changes the weight of open question 2 below.

The cost is not hypothetical. This was found by reading the two footers during demo
preparation and being unable to answer the question they exist to answer — three days before
a rehearsal in which both URLs are shown on screen and someone will ask exactly this.

## Proposed outcome

Standing in front of the preview and production pages, a reader can tell whether they are
looking at the same site, without leaving the page and without knowing how GitHub constructs
merge refs.

Concretely, once this is done:

- Each build carries an identifier that is **equal between two builds of the same site
  content** and different otherwise — so comparison is reading two values, not reasoning about
  commit topology.
- That identifier is derivable from the checkout the build already has, so no workflow file
  changes and no new environment variable is introduced.
- A reader who sees the two values differ can tell that they differ. Explaining *why* they
  differ is out of scope for this intent.
- Nothing claims more than it knows: where the value cannot be computed, the footer omits it
  rather than guessing, the same rule the rest of the stamp already follows.

The test that this happened: build the same source twice, once as preview and once as
production, and the new value matches while the commit SHAs do not.

## Affected systems

- `scripts/build-info.mjs` — the generator, which already runs before every build
- `site/src/lib/build-info.js` — the tolerant reader shared by the layout and the footer
- the footer partial that renders the stamp
- `evals/run.mjs` — where an assertion about the new field would live
- No workflow, no credential, no CI permission change. That is a deliberate constraint, below.

## Constraints

- **Approach already chosen.** Two designs were considered on 2026-09-13 and the operator
  chose the first:
  - **(A, chosen)** a content digest — a value derived from the site source tree, equal
    whenever the content is equal. Needs no workflow change.
  - **(B, not chosen)** stamping the pull request's base and head SHAs instead of the merge
    commit, which would also make the stale-base problem visible, but requires `preview.yml`
    to pass `base.sha` — a guardrail file, so a proposal and a human commit.

  Recorded here rather than left open because it was decided before the spec existed. B
  remains a reasonable follow-up if A proves too coarse.
- **A is known to be a strong signal, not a proof.** The built output also depends on the root
  `package.json`, `.nvmrc` and the base path passed on the command line. The spec must say
  plainly what the value does and does not cover, or this feature repeats 0001's mistake at a
  smaller scale — a stamp that reads as more authoritative than it is.
- **Zero tokens.** This is a script, like the diagram and the evals.
- **No guardrail file may be touched.** Partly cost, mostly timing: a workflow change three
  days before a rehearsal needs a proposal, a human commit and a deploy to verify.
- **Dates.** Demo-ready 2026-09-16, rehearsals 09-14 and 09-21, talk 09-23. The footer is on
  screen during the demo, so a change that breaks it is worse than the ambiguity it replaces.
- Local builds must keep working with no network and no GitHub environment variables.

## Open questions

1. **What does the footer call it?** "Content", "digest", "source" — the label has to mean
   something to an audience seeing it for eight seconds on a projector, and this is the part
   most likely to be got wrong by someone who already understands the mechanism. — Rashid
2. **Is the stale-base problem in scope, or a separate intent?** A does not solve it: two
   builds can share site content while sitting on different mains. The pull request comment in
   `preview.yml` is making a false claim today either way, and fixing that is a workflow change
   this intent has ruled out. Leaving it unfixed and unmentioned is the option to argue
   against. — Rashid

   **Reweighted after the unfurl incident above.** This started as a labelling question and is
   now known to have caused a wrong result, silently, in the workflow that publishes previews.
   That does not automatically pull it into this intent — a problem getting worse is a reason
   to give it its own intent, not to widen one already scoped to a footer value. The real
   decision is which of these:

   - **(i)** keep 0004 as scoped, and open a separate intent for stale-base, which will need a
     `preview.yml` change and therefore a proposal and a human commit;
   - **(ii)** widen 0004 to state the base alongside the content digest, accepting the
     workflow change and its timing risk before 09-16;
   - **(iii)** neither, before the talk — and say so in the runbook, since a preview built by
     superseded machinery is exactly the kind of thing that goes wrong on stage.

   Drafting agent's recommendation is (i): the weight is real but it is a different problem,
   and the constraint that kept guardrail files untouched until after the rehearsals has not
   changed. The decision is Rashid's. — Rashid

## Notes

Found by reading the two footers, not by any check. The footer is the one part of this site
that describes the site itself, and it had no test that its description was useful — only that
it rendered. Relates to [intent 0001](../0001-build-provenance/intent.md), whose outcome this extends rather than
corrects: 0001 answered "which build is this", and the gap is "relative to what".
