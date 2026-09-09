// PreToolUse(Write|Edit|MultiEdit) — accepted SDLC artifacts are frozen.
//
// An intent or spec marked `accepted` records a human decision. Quietly editing it after
// the fact would make the artifact chain worthless as an audit trail: the diff would no
// longer show what was agreed, only what someone later wished had been agreed.
//
// Changing an accepted artifact is legitimate — it just has to be visible. Set the status
// to `superseded` and write a new numbered artifact, or ask the human to reopen it.

import { readFileSync, existsSync } from 'node:fs';
import { relative, isAbsolute, sep } from 'node:path';

const ARTIFACT = /^docs\/sdlc\/\d{4}-[a-z0-9-]+\/(intent|spec)\.md$/;
const ACCEPTED = /^\s*-\s*\*\*Status:\*\*\s*accepted\s*$/im;

function toRepoRelative(filePath, cwd) {
  if (!filePath) return null;
  const rel = isAbsolute(filePath) ? relative(cwd, filePath) : filePath;
  return rel.split(sep).join('/').replace(/^\.\//, '');
}

let input;
try {
  input = JSON.parse(readFileSync(0, 'utf8'));
} catch {
  process.exit(0);
}

const cwd = input.cwd ?? process.cwd();
const target = toRepoRelative(input.tool_input?.file_path, cwd);

if (target && ARTIFACT.test(target) && existsSync(target)) {
  let body = '';
  try {
    body = readFileSync(target, 'utf8');
  } catch {
    process.exit(0);
  }

  if (ACCEPTED.test(body)) {
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'deny',
          permissionDecisionReason:
            `Blocked by protect-approved: ${target} is marked accepted, and an accepted ` +
            `artifact records a decision a human already made. Editing it in place would ` +
            `erase what was actually agreed. Either mark it superseded and write the next ` +
            `numbered artifact, or ask the human to move it back to draft.`,
        },
      }),
    );
  }
}

process.exit(0);
