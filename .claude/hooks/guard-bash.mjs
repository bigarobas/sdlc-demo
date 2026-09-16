// PreToolUse(Bash) — deny the small set of commands that are hard to undo.
//
// Not a security boundary: an agent that wanted to bypass this could. It is a
// seatbelt against the plausible accident, which is the failure mode that actually
// happens. The production credential is guarded by the GitHub Environment gate
// (spec D6), not by this file.

import { readFileSync } from 'node:fs';

const RULES = [
  {
    pattern: /\bgit\s+push\b[^\n]*--force(?!-with-lease)/,
    why: 'force-push discards history that CI and review already ran against; use --force-with-lease',
  },
  { pattern: /\bgit\s+reset\s+--hard\b/, why: 'discards uncommitted work with no recovery path' },
  {
    pattern: /\brm\s+-[a-zA-Z]*[rf][a-zA-Z]*\s+\/(?:\s|$)/,
    why: 'recursive delete of the filesystem root',
  },
  {
    pattern: /\bcurl\b[^|]*\|\s*(?:ba)?sh\b/,
    why: 'piping a downloaded script straight into a shell executes unreviewed remote code',
  },
  { pattern: /\bgh\s+repo\s+delete\b/, why: 'deletes the repository' },
  {
    pattern: /\bgit\s+push\b[^\n]*\bmain\b/,
    why: 'pushing straight to main bypasses the PR, the review and the deploy gate',
  },
  // `gh api` with a write method is every denied command wearing a different hat.
  //
  // settings.json denies `gh pr merge`, `gh secret`, `gh repo edit` and `gh workflow run`.
  // All four are reachable as REST calls — `gh api -X PUT repos/o/r/pulls/7/merge` is the
  // merge, through a door the deny list does not watch.
  //
  // This belongs in the hook rather than in settings.json because permission rules match by
  // prefix: a deny for `Bash(gh api -X:*)` catches the flag only when it comes first, and
  // `gh api repos/o/r -X PUT` sails past it. A regex sees the flag wherever it appears, which
  // is the whole reason the deterministic layer exists alongside the declarative one.
  //
  // Reads are untouched. `gh api` without a write method is not matched here, and is not on
  // the allowlist either, so it prompts — which is the right treatment for a tool that can
  // reach every endpoint the token has.
  {
    pattern: /\bgh\s+api\b[^\n]*(?:-X|--method)[=\s]+(?:POST|PUT|PATCH|DELETE)\b/i,
    why: 'gh api with a write method reaches merge, secrets and settings — the endpoints settings.json denies by name',
  },
];

function deny(reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: reason,
      },
    }),
  );
  process.exit(0);
}

let input;
try {
  input = JSON.parse(readFileSync(0, 'utf8'));
} catch {
  process.exit(0);
}

const command = input.tool_input?.command ?? '';
const hit = RULES.find((r) => r.pattern.test(command));
if (hit) {
  deny(`Blocked by guard-bash: ${hit.why}. If this is genuinely what you want, run it yourself.`);
}

process.exit(0);
