---
summary: How each of these was found, what it cost, and the one thing they have in common
---

The list above is what to do. This is what happened, which is the part that took the time.

**The favicon** was caught by the link checker on its first run, before a single line of
content existed. The very first thing the pipeline did was find a bug in the template it had
been scaffolded from.

**`start-server-and-test`** was not exotic. It is the standard tool for the job, and it simply
does not run on this machine.

**The preview base** is the one that should worry you. It served the wrong path while the
build was correct, and a link checker aimed at the wrong base reports a cheerful green. The
check was running. It was checking the wrong thing.

**The verification loop hung, and the check said it passed.** Worse than the hang was how it
was measured: the exit code read belonged to a `grep` in a pipeline rather than to the command
that mattered. That produced a false green which hid a real hang for two rounds, until a CI
timeout made it undeniable.

**The `--max-turns` cap** cost roughly $2.80 of quota for zero reviews. A cap that halts work
halfway is strictly worse than either finishing or never starting — the run is billed in full
and produces nothing. And the lesson only got applied where it hurt: `claude.yml` still passes
`--max-turns 20`, and a comment at the top of that file still calls it a deliberate cap.

**The agent that succeeded in six seconds** ran, exited zero, wrote no file, opened no pull
request and left no comment. It had been told to write a file with no ability to write one.
A silent green no-op is the worst failure mode here — a crash is loud, and this was not.

**The gate switched itself off** and nothing announced it. The production credential sat behind
nothing at all for a morning, found by an API check rather than by a notification. Going
private cost the Pages site too, which is a decent argument for running a pipeline on
infrastructure you own.

**The bot that could not trigger a bot** was built to open an issue _and_ label it, so the
drafting agent would pick it up unattended. GitHub refuses that on purpose, to stop exactly
the loop being built. The better fix was to delete the ambition: a breach is evidence, not a
decision, and a human triages it.

**The diagram caught a claim the code review missed.** A wrong trigger description had survived
in the YAML, unremarked, through review — and one means a maintainer triaging while the other
means anyone on the internet. That is the whole security model, wrong in writing, until
something had to state it out loud.

## The through-line

Printing the right output is not the same as succeeding. Four of these were green when they
were broken, and the ones that hurt most were the quiet ones. A verification loop needs its own
verification, and the fastest way to find a wrong claim is to make something state it out loud.
