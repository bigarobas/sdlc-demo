---
slug: scars
title: What broke while building this
stage: evidence
---

Every failure below was found by the deterministic layer or by a measurement, not by reading
code and thinking hard. They are listed because they are the actual argument for having one.

## A laptop and a CI runner are different computers

**A hardcoded `/favicon.svg`.** Both deploy targets live in a subfolder, so the path Astro's
own template ships with returns 404. Caught by the link checker on its first run, before a
single line of content existed.

**`start-server-and-test` spawns `wmic.exe`**, which Windows 11 no longer ships. The standard
tool for the job simply does not run on this machine.

**`astro preview` reads `base` from the config, not from the build.** It served the wrong path
while the build was correct — and a link checker aimed at the wrong base reports a cheerful
green.

**The verification loop hung, and the check said it passed.** `astro preview` daemonises on
Windows and stays in the foreground on Linux, so a blocking call returned on the laptop and
hung forever in CI. Worse, the way it was being measured read the exit code of a `grep` in a
pipeline rather than the command that mattered — a false green that hid a real hang for two
rounds, until a CI timeout made it undeniable.

**`prettier --check` disagreed with itself** across machines, because Git checks files out with
CRLF on Windows while prettier expects LF. The same commit was clean on the runner and dirty
on the laptop.

## Configuration that looked right and was not

**A cost control that cost money and produced nothing.** `--max-turns` was added to the review
workflow to bound spend. It bounded the work instead: two runs stopped mid-review, at 8 turns
and then at 25, and posted nothing at all. Roughly $2.80 of quota for zero reviews. A cap that
halts work halfway is strictly worse than either finishing or never starting. Deleting it
fixed the problem — `timeout-minutes` was the right instrument all along, because wall-clock
time is what actually tracks spend.

**An agent that succeeded in six seconds having done nothing.** The intent-drafting workflow
ran, exited zero, and wrote no file, opened no pull request, left no comment. Automation mode
grants an agent no shell and no GitHub access unless the workflow says so, and it had been
told to write a file with no ability to write one. **A silent green no-op is the worst failure
mode here** — a crash is loud, and this was not.

**The gate switched itself off, quietly.** Making the repository private for one morning
deleted the Pages site _and_ disabled the required-reviewer rule on the production
environment, because environment protection rules are a public-repository feature on the free
plan. The production credential sat behind nothing at all, and nothing announced it. Found by
an API check, not by a notification.

**A bot cannot trigger a bot, and that turned out to be right.** The monitoring workflow was
built to open an issue _and_ label it, so the drafting agent would pick it up unattended. It
never fired: GitHub does not create workflow runs from events triggered by its own token,
specifically to stop loops like that one. A personal access token would have defeated the
rule. The better fix was to delete the ambition — a breach is evidence, not a decision, and
the playbook always said a human triages it.

**The diagram caught a claim the code review missed.** Generating the architecture picture
forced every workflow to state its own trigger in words. One came out as "issue labelled" when
the workflow actually listens for _any_ issue being opened — a difference that is the whole
security model, since one means a maintainer triaging and the other means anyone on the
internet. It had survived in the YAML, unremarked, through review.

## The through-line

Printing the right output is not the same as succeeding. Four of these were green when they
were broken, and the ones that hurt most were the quiet ones. A verification loop needs its own
verification, and the fastest way to find a wrong claim is to make something state it out loud.
