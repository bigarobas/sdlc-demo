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
    // Every settings file, not just the project one.
    //
    // This pattern used to be /^\.claude\/settings\.json$/ — an exact match, which left
    // `.claude/settings.local.json` writable. Local settings take PRECEDENCE over project
    // settings, so an agent that wrote that one file could grant itself everything the deny
    // list refuses, and the deny list would still be sitting there looking enforced.
    //
    // Found while planning intent 0050, which is the intent about writing the permission
    // boundary down. The boundary had a door in it, and the thing that found the door was
    // taking the spec's own instruction seriously: verify before believing.
    pattern: /^\.claude\/settings(\.[A-Za-z0-9-]+)*\.json$/,
    why: 'settings.json and settings.local.json wire the hooks and permissions, and local overrides project. Editing either would disable the very rule denying this edit.',
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
