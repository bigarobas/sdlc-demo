// PostToolUse(Write|Edit|MultiEdit) — append to the audit trail.
//
// The playbook asks that every commit, approval and hook decision be logged with a
// timestamp. Git already records the commits and GitHub records the approvals; this
// covers the part nobody otherwise sees, which is what the agent touched and when.
//
// Deliberately dumb: one line per file write, no buffering, no rotation. If it ever grows
// past a few hundred lines per feature, that is a signal about the work, not the log.

import { readFileSync, appendFileSync, mkdirSync } from 'node:fs';
import { relative, isAbsolute, sep, dirname } from 'node:path';

const LOG = 'docs/sdlc/audit-log.md';

let input;
try {
  input = JSON.parse(readFileSync(0, 'utf8'));
} catch {
  process.exit(0);
}

const cwd = input.cwd ?? process.cwd();
const raw = input.tool_input?.file_path;
if (!raw) process.exit(0);

const target = (isAbsolute(raw) ? relative(cwd, raw) : raw).split(sep).join('/');
if (target.startsWith('docs/sdlc/audit-log')) process.exit(0); // do not log the log

const when = new Date().toISOString().replace('T', ' ').slice(0, 19);
const session = String(input.session_id ?? 'unknown').slice(0, 8);

try {
  mkdirSync(dirname(LOG), { recursive: true });
  appendFileSync(LOG, `| ${when} | ${session} | ${input.tool_name ?? '?'} | \`${target}\` |\n`);
} catch {
  // an audit trail that breaks the session is worse than a gap in the audit trail
}

process.exit(0);
