# Plan 0000 — Setup, evening by evening

Implements [spec.md](./spec.md). Talk is **2026-09-23**; demo-ready target is **2026-09-16**.

Every credential step is yours to perform — I never handle tokens, FTP passwords or webhook
URLs. Where a step needs one, it is marked **[you]**.

**Shell note.** The commands here are one per line on purpose. Windows PowerShell 5.1 — the
default on this machine — does not support `&&` as a statement separator, so chained commands
copied from a Linux or macOS guide fail with `ParserError: InvalidEndOfLine`. Use `;` if you
must chain, or run Git Bash. The same applies to `npm run` scripts: anything with shell glue
in it is a portability bug waiting for a colleague, which is why `npm run verify` is a Node
script rather than a chain of commands.

---

## Evening 1 — Tooling and accounts (~90 min)

Goal: `@claude` answers a comment on a real issue in a real repo. Nothing else.

1. **Install the two missing CLIs.**

```bash
winget install --id GitHub.cli -e
npm install -g @anthropic-ai/claude-code
```

2. **Authenticate.** **[you]**

```bash
gh auth login
```

3. **Create the repo.** Name it something colleagues will recognise later — this URL goes on
   the last slide.

```bash
gh repo create sdlc-demo --public --source=. --remote=origin --push
```

4. **Generate the CI credential.** **[you]** Run `claude setup-token` and store the result as
   the repository secret `CLAUDE_CODE_OAUTH_TOKEN`. This token bills your Pro quota, so
   nothing in CI should be uncapped (spec §6).

5. **Install the GitHub App and the first workflows.** Run `claude` in the repo, then
   `/install-github-app`. Choose the subscription-token path, and select **both** the
   `@claude` mention workflow and the review workflow — those are agent workflows 1 and 3
   of the three in spec §4. Merge the PR it opens.

6. **Verify.** Open an issue, comment `@claude summarise this repository`, watch the run.
   If this does not work tonight, nothing later will.

**Done when:** a `@claude` reply appears on a GitHub issue.

---

## Evening 2 — The site, and the two deploy paths (~2h)

Goal: your domain serves a real page, and only you can put it there.

1. **Scaffold Astro** into `site/`, Node 22 for headroom:

```bash
nvm use 22.19.0
npm create astro@latest site -- --template minimal --typescript strict --no-git
```

2. **`astro.config.mjs` reads `site` and `base` from env** so one codebase produces the
   production build (`https://rashid.fr` + `/sdlc/`) and the preview build
   (`https://<user>.github.io` + `/sdlc-demo/preview/`). See spec §9.

   Layout is **long-scroll with a sticky section nav** — no keyboard deck navigation.

3. **`npm run verify`** = `astro build` + `linkinator dist` + `playwright test`. One command
   (D7). Add `verify.yml` running it on every push.

4. **`preview.yml`**: on pull request, build with the preview base, publish to the `gh-pages`
   branch under `preview/`, comment the URL on the PR. Enable Pages **[you]**:
   Settings → Pages → source `gh-pages`.

5. **The production gate** **[you]**: Settings → Environments → new environment `production`
   → **Required reviewers: yourself**. Add `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`
   *scoped to that environment only* — not as repository secrets. This is what makes D6 true
   rather than decorative: the credential does not exist outside an approval.

6. **`deploy.yml`**: on push to `main`, job with `environment: production`, using
   `SamKirkland/FTP-Deploy-Action` to push `site/dist/`. Deploy into a versioned folder and
   flip, so a bad deploy on stage is recoverable.

**Done when:** merging to `main` parks a job awaiting *your* click, and clicking it updates
your domain.

---

## Evening 3 — The `.claude/` layer (~2h)

Goal: the mechanisms exist and one of them visibly says no.

1. `AGENTS.md` (canonical) + `CLAUDE.md` containing `@AGENTS.md` and Claude-only extras (D2).
   Keep both short — re-read on every run.
2. Four skills: `intent`, `spec`, `ship`, `house-style`.
3. Five Node hooks (D1) wired in `.claude/settings.json`.
4. Two subagents: `verifier`, `simplifier`.
5. `docs/sdlc/REVIEW.md` — review policy and severity definitions.

**Done when:** you ask Claude to edit `.github/workflows/deploy.yml` and it is denied by
`protect-guardrails.mjs`. Screenshot that — it is a slide.

---

## Evening 4 — Autonomy and the closing loop (~2h)

Goal: the circle closes without you.

1. **`.github/ISSUE_TEMPLATE/intent.yml`** — the five intent fields as form inputs. The
   template is doing real work: it is how a human hands structured context to an agent.
2. **`agent-intent.yml`** — the only agent workflow written by hand (#2 of 3). On an issue
   labelled `intent`, run the `intent` skill, write `docs/sdlc/NNNN-slug/intent.md`, open a
   PR. Capped per spec §6. This is the autonomy proof: nobody typed anything.
3. **Check the two installed workflows** from Evening 1 for one thing: they must **not** pass
   `github_token: ${{ secrets.GITHUB_TOKEN }}`. If they do, CI will not run on the agent's
   own commits and the entire verification story dies silently — green everywhere, verifying
   nothing.
4. **`bands.yaml` + `bands.yml`** (D3, zero tokens): cron every 6h → `curl` the live site,
   check status, page weight and build time against thresholds → on breach,
   `gh issue create --label intent`. Test it by lowering a threshold until it fires.
5. **`evals/run.mjs`** + two cases, run in CI on `.claude/**` changes.
6. **`security.yml`** — `npm audit`, agent step commented out and labelled.
7. **Slack** **[you]**: create an app at api.slack.com, enable Incoming Webhooks, store
   `SLACK_WEBHOOK_URL`. Post on: intent drafted, PR opened, deploy awaiting approval,
   deploy done, band breached.

**Done when:** lowering a band threshold produces an issue, which produces an agent PR,
with no human input.

---

## Evening 5 — Content (~2h+)

The site sections, in talk order:

1. The thesis
2. **What I actually did so far** — plan-then-implement, personal skills carrying handoffs,
   decisions, chunking and prompt generation. What worked, what did not.
3. The six stages and the artifact chain
4. The mechanisms — skills, hooks, subagents, MCP (static code samples)
5. **How this very repo implements it** — annotated file tree, real links
6. The autonomous loop — the demo
7. Governance: the agent may act up to the production gate and cannot pass it
8. **Real vs shell** — the honesty section
9. Claude Code ↔ Cursor mapping
10. What it cost — quota, evenings, what broke
11. Reproduce this

---

## Dry runs

- **2026-09-14** — full Lane B rehearsal end to end, and record the 90-second fallback video.
- **2026-09-21** — second rehearsal on the final content. Not later.

## Demo choreography, 30 minutes

Two lanes, because one agent run does not fit in a talk.

**Lane A — instant, deterministic, unmissable (~90 s total, drop in anywhere)**
- Ask Claude to edit `deploy.yml` → denied by the hook.
- Lower a band threshold → cron check fires → issue opens by itself.

**Lane B — the full cycle, fired early and harvested late**
- **T+2 min:** on stage, file the intent issue and label it. Walk away from it.
- **T+3 to T+18:** the concepts, sections 1–5. Slack pings arrive in the background, visibly.
- **T+18:** the agent's PR is waiting — preview URL, review comment, green checks. Merge.
- **T+20:** the deploy job is parked on the `production` gate. Approve it on stage. Refresh
  your domain. That click is the whole governance argument, performed rather than asserted.
- **Fallback:** the recorded 90 s capture, plus the PR history from the 09-14 rehearsal.

## Explicitly out of scope

Trello, Claude-as-Slack-teammate, a custom MCP server, LLM-judged evals, agentic security
scanning, per-PR preview URLs. All are backlog items, and saying so on the site is part of
the point.
