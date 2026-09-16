---
name: intent
description: Stage 1 (Plan). Turn a raw idea, a request, or a GitHub issue into a docs/sdlc/NNNN-slug/intent.md artifact. Invoked with a description — /intent "add a favicon to the website" — it interviews the operator, opens the issue that supplies the id, and can finish with an accepted intent in one sitting. Use before any design or implementation work, and whenever someone describes a problem without an accepted intent on record.
---

# Writing an intent

An intent states a **problem and a desired outcome**. It does not state a solution. If you
find yourself naming files, libraries or APIs, you have started the spec early — stop, and
move that material to the open questions.

The intent is the cheapest artifact to change and the most expensive to get wrong, because
everything downstream inherits its framing.

## The id is the issue number

`docs/sdlc/0046-repo-tree-visualization/` is the intent drafted from issue #46. Four digits,
zero-padded; more than four once the repository gets past issue 9999.

**Every intent has an issue, and the issue number is the id.** If the work started as a
conversation rather than an issue, open the issue first. That is not paperwork — it is where
the id comes from and where people argue about the framing before anyone writes markdown.

The rule exists because the old one broke. Incrementing from the directory listing means the
number is chosen at drafting time, so two people drafting at once pick the same one and
neither can tell. That happened: `0003-generated-repo-tree` and `0003-repo-tree-visualization`
were filed within a day, by a human and by `agent-intent.yml`, and the collision only became
visible when both were on disk. GitHub already allocates unique numbers; use those instead of
inventing a second counter that nobody coordinates.

It also makes the trail two-way. The id tells you where the discussion is, and the issue
tells you where the artifact is.

Numbers will have gaps — 0034, 0046, 0051. That is what monotonic-but-not-sequential looks
like, and it is not a problem.

`0000` to `0003` predate this rule and keep their numbers. Do not renumber them; the links and
commit messages that point at them are worth more than a tidy sequence.

One issue, one intent. If an issue turns out to hold two problems, open a second issue — the
same rule as "one intent, one problem", enforced one level up.

## Steps

1. Take the id from the issue number, zero-padded to four digits. Slug is kebab-case, three
   or four words.
2. Write `docs/sdlc/NNNN-slug/intent.md` using the template below.
3. Ask the questions you cannot answer yourself. Do not invent constraints, dates, budgets
   or account names — leave them as open questions and say who must answer.
4. Stop. The intent needs a human `accepted` before Stage 2 begins.

## Interactive mode — `/intent "add a favicon to the website"`

Invoked with a description rather than an issue number, this drafts the intent **with the
operator in the room** instead of leaving questions for later. It exists because the
alternative route costs six actions — open an issue, label it, wait for the drafting agent,
read its pull request, edit the answers in, merge — and because the answers kept ending up
somewhere nothing reads.

### The order matters

1. **Ask first, write second.** Use `AskUserQuestion`, **at most four questions, batched into
   one round**. Ask only what changes the work: if two different answers produce the same
   intent, it is not a question, it is a decision you should make and record. For "add a
   favicon" that is probably one question, not four.
2. **Open the issue**, with `gh issue create`, titled as the problem. The number it returns is
   the id. Not paperwork: the id rule above exists because a locally chosen number collides,
   and this is where the two-way trail comes from.
3. **Write `intent.md`**, with the answers folded into the sections they belong to — never
   left in an Open questions list that has already been answered out loud.
4. **Show the assembled file and ask once: accept it?** This step is not optional and not a
   formality.
5. On yes, set `Status: accepted` and commit. On no, leave `draft` and say what would need to
   change.

### Why step 4 cannot be skipped

Accepting is the gate the whole loop is built around. Answering four questions is not the same
as reading the document those answers were assembled into — the intent is the synthesis, and
the synthesis is the thing being agreed to. A skill that emitted `accepted` without showing
the artifact would be collecting agreement for something nobody read, which is the exact
failure `Status:` exists to prevent.

With step 4, `accepted` is honest and is arguably a stronger agreement than merging a pull
request somebody skimmed.

### Say how it was accepted

The commit message must record that the intent was drafted and accepted interactively, in one
sitting, rather than read and accepted separately. A reviewer can then tell the two apart —
the same requirement `--auto` carries, for the same reason.

### When not to use it

When the framing is genuinely contested, or when somebody other than the operator should weigh
in. An issue is a place several people can argue before anything is written; this is a
conversation with one person. Speed is the trade, and it is the right trade for work whose
shape is already clear and the wrong one for work whose shape is the question.

### It needs the network

`gh issue create` means this does not work offline. Say so and stop, rather than inventing an
id to keep going.

## Template

```markdown
# Intent NNNN — <short title>

- **Status:** draft | accepted | superseded
- **Author:** <name>
- **Date:** <YYYY-MM-DD>

## Problem

What is wrong today, for whom, and how you know. Observable, not speculative.

## Proposed outcome

What is true once this is done. Written so that someone else could tell whether it happened.

## Affected systems

Repositories, services, accounts, external providers.

## Constraints

Deadlines, budget, runtime limits, skills available, anything already decided elsewhere.
Include cost constraints explicitly — they shape design more than most requirements.

## Open questions

Things a human must decide. Name the decision, not just the topic.
```

## Rules

- The four `##` headings Problem, Proposed outcome, Affected systems and Constraints are
  required. `evals/run.mjs` asserts they exist.
- One intent, one problem. Two problems means two intents.
- Keep it under a page. An intent nobody reads is a formality, not a control.
- When the intent came from a GitHub issue, link the issue and keep the reporter's words
  where they were precise. Do not tidy away a good symptom description into vagueness.
- When it came from a control-band breach, include the measurement that breached and its
  threshold.
