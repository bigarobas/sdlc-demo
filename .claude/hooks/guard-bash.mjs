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
