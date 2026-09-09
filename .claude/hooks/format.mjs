// PostToolUse(Write|Edit|MultiEdit) — format the file that was just touched.
//
// Formatting is not worth a review comment, a lint failure, or a turn of the agent's
// attention. A hook settles it silently and identically every time, which is the whole
// argument for the deterministic layer: spend the model on decisions, not on whitespace.
//
// Never fails the tool call. A formatter that blocks work would be worse than none.

import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { extname } from 'node:path';

const FORMATTABLE = new Set([
  '.js',
  '.mjs',
  '.cjs',
  '.ts',
  '.mts',
  '.tsx',
  '.jsx',
  '.json',
  '.css',
  '.md',
  '.astro',
  '.yml',
  '.yaml',
]);

let input;
try {
  input = JSON.parse(readFileSync(0, 'utf8'));
} catch {
  process.exit(0);
}

const file = input.tool_input?.file_path;
if (!file || !FORMATTABLE.has(extname(file).toLowerCase())) process.exit(0);

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
spawnSync(npx, ['--no-install', 'prettier', '--write', file], {
  stdio: 'ignore',
  shell: process.platform === 'win32',
  timeout: 15_000,
});

process.exit(0);
