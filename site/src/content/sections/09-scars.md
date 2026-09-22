---
slug: scars
title: What broke while building this
stage: evidence
---

Every failure below was found by the deterministic layer or by a measurement, not by reading
code and thinking hard. They are listed because they are the actual argument for having one.

## A laptop and a CI runner are different computers

**A hardcoded `/favicon.svg`.** Both deploy targets live in a subfolder, so the path Astro's
own template ships with returns 404. Use `import.meta.env.BASE_URL`.

**`start-server-and-test` spawns `wmic.exe`**, which Windows 11 no longer ships.

**`astro preview` reads `base` from the config, not from the build.** Pass `--base` to both,
or a link checker aimed at the wrong path reports green.

**`astro preview` daemonises on Windows and stays in the foreground on Linux**, so a blocking
call returns on a laptop and hangs forever in CI. Spawn it asynchronously and exit explicitly.

**Never read `$?` after a pipe.** It reports the last command's status, not the one that
mattered, so a hang or a failure looks green.

**`prettier --check` disagreed with itself** across machines: Git checks files out with CRLF on
Windows, prettier expects LF. `.gitattributes` forces `eol=lf` everywhere.

## Configuration that looked right and was not

**`--max-turns` is the wrong instrument for bounding agent cost.** It bounds the work, not the
spend — two runs stopped mid-review and posted nothing, for roughly $2.80. `timeout-minutes`
is the right one, because wall-clock time is what tracks spend.

**Automation mode grants an agent no tools by default** — no shell, no GitHub access — unless
the workflow lists them. Without them it exits zero having done nothing.

**Environment protection rules are a public-repository feature on the free plan.** Making the
repository private for one morning deleted the Pages site and silently disabled the
required-reviewer rule on production.

**GitHub does not create workflow runs from events triggered by its own token**, so a bot
cannot start another bot. A personal access token would defeat that, and should not be used
to.

**Generating the architecture diagram forced every workflow to state its own trigger in
words**, which surfaced one described as "issue labelled" that actually listened for any issue
being opened.
