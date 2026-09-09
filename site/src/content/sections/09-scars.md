---
slug: scars
title: What broke while building this
stage: evidence
---

Every bug below was found by the deterministic layer, not by reading code. They are listed
because they are the actual argument for having one.

**A hardcoded `/favicon.svg`.** Both deploy targets live in a subfolder, so the path Astro's
own template ships with returns 404. Caught by the link checker on its first run, before a
single line of content existed.

**`start-server-and-test` spawns `wmic.exe`**, which Windows 11 no longer ships. The standard
tool for the job simply does not run on this machine.

**`astro preview` reads `base` from the config, not from the build.** It served the wrong path
while the build was correct — a link checker aimed at the wrong base reports a cheerful green.

**The verification loop hung, and the check said it passed.** `astro preview` daemonises on
Windows and stays in the foreground on Linux, so a blocking call returned on the laptop and
hung forever in CI. Worse, the way it was being measured read the exit code of a `grep` in a
pipeline instead of the command that mattered — a false green that hid a real hang for two
rounds, until a CI timeout made it undeniable.

**`prettier --check` disagreed with itself** across machines, because Git checks files out with
CRLF on Windows while prettier expects LF. The same commit was clean on the runner and dirty
on the laptop.

Four of those five are the same story: **a laptop and a CI runner are different computers.**
The generalisable lesson is smaller and sharper than any of them — printing the right output
is not the same as succeeding, and a verification loop needs its own verification.
