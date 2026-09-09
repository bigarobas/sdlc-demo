// PreToolUse(Write|Edit|MultiEdit) — the agent cannot edit its own guardrails.  [spec D5]
//
// This is the governance thesis made mechanical. Everything else in this repo is a
// convention the model is asked to follow; this is a rule it cannot decline. If the
// agent could rewrite the workflows, the hooks, or its own permissions, every other
// control in the repo would be advisory.
//
// Denials are decided here, not argued in a prompt.
//
// `existingOnly` narrows one rule: creating a NEW hook file is allowed, because a hook is
// inert until settings.json registers it, and settings.json is fully protected. Editing a
// hook that already exists is denied, because that is how a registered guardrail would be
// neutered. Without this distinction the agent could never author a hook at all, and every
// hook in the repository would have to be hand-typed by a human forever.

import { readFileSync, existsSync } from 'node:fs';
import { relative, isAbsolute, sep } from 'node:path';

const PROTECTED = [
  {
    pattern: /^\.github\/workflows\//,
    why: 'CI workflows define what runs without a human. An agent that can edit them can grant itself new powers.',
  },
  {
    pattern: /^\.claude\/settings\.json$/,
    why: 'settings.json wires the hooks and permissions. Editing it would disable the very rule denying this edit.',
  },
  {
    pattern: /^\.claude\/hooks\//,
    existingOnly: true,
    why: 'A registered hook is the deterministic layer. A new hook file is inert until a human registers it in the protected settings.json, but editing one that already exists could neuter it.',
  },
  {
    pattern: /^\.github\/(CODEOWNERS|dependabot\.yml)$/,
    why: 'Ownership and dependency policy are human decisions.',
  },
];

function toRepoRelative(filePath, cwd) {
  if (!filePath) return null;
  const rel = isAbsolute(filePath) ? relative(cwd, filePath) : filePath;
  return rel.split(sep).join('/').replace(/^\.\//, '');
}

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
  process.exit(0); // never break the session on a malformed payload
}

const cwd = input.cwd ?? process.cwd();
const target = toRepoRelative(input.tool_input?.file_path, cwd);

if (target) {
  const hit = PROTECTED.find(
    (rule) => rule.pattern.test(target) && !(rule.existingOnly && !existsSync(target)),
  );
  if (hit) {
    deny(
      `Blocked by protect-guardrails: ${target} is a guardrail file, and the agent cannot ` +
        `edit its own guardrails. ${hit.why} A human edits this file directly, in a commit ` +
        `that carries their name.`,
    );
  }
}

process.exit(0);
