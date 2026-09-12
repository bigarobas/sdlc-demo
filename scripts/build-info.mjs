// Stamp the build with what it is.  [intent 0001, spec D1-D6]
//
// Runs before every build via `prebuild` in site/package.json — not the root one, because
// `npm run verify` and CI both call `npm --prefix site run build` directly and a root hook
// would never fire.
//
// Writes site/src/generated/build-info.json, which is gitignored. Its neighbour pipeline.svg
// is committed, and the difference matters: the diagram is committed so it can be
// drift-checked, while this file differs on every build by construction, so committing it
// would mean a dirty tree after every build.
//
// Nothing here is guessed. A value that cannot be determined is null and renders as absent,
// because a footer that invents a deploy time would be the same class of false claim the
// whole feature exists to prevent.

import { writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolved from this file's own location, never from the working directory. `prebuild` runs
// with cwd set to site/, so a repo-relative path wrote site/site/src/generated/build-info.json
// — and because the import is deliberately tolerant, the build then succeeded with an empty
// footer and verify went green. The tolerant import and the silent failure are the same
// mechanism seen from two sides.
const OUT = fileURLToPath(new URL('../site/src/generated/build-info.json', import.meta.url));

function git(args) {
  const r = spawnSync('git', args, { encoding: 'utf8', shell: process.platform === 'win32' });
  return r.status === 0 ? r.stdout.trim() : null;
}

// --- environment -------------------------------------------------------------------------
// Explicit, never inferred from the base path or the hostname (spec D5). Both of those have
// already changed once in this project, and an inferred answer changes with them.
const env = process.env.BUILD_ENV ?? 'local';

// --- commit ------------------------------------------------------------------------------
const shaFull = process.env.GITHUB_SHA ?? git(['rev-parse', 'HEAD']);
const sha = shaFull ? shaFull.slice(0, 7) : null;

// --- pull request ------------------------------------------------------------------------
// Preview is handed the number by GitHub. Production has to read it out of the squash commit
// subject, where GitHub writes "(#27)" — which works only because this repository squashes,
// and degrades to null rather than to a wrong number if that ever changes (spec D4).
function prFromSubject() {
  const subject = process.env.GITHUB_SHA
    ? git(['log', '-1', '--format=%s', process.env.GITHUB_SHA])
    : null;
  const m = subject?.match(/\(#(\d+)\)\s*$/);
  return m ? Number(m[1]) : null;
}

const pr = process.env.PR_NUMBER ? Number(process.env.PR_NUMBER) : prFromSubject();

// --- working tree ------------------------------------------------------------------------
// Only meaningful locally: CI checks out a clean tree, so a dirty flag there would be noise.
const dirty = env === 'local' ? Boolean(git(['status', '--porcelain'])) : false;

const info = {
  env,
  sha,
  shaFull,
  pr: Number.isFinite(pr) ? pr : null,
  builtAt: new Date().toISOString(),
  dirty,
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(info, null, 2) + '\n');

console.log(
  `  build-info: ${info.env}` +
    (info.sha ? ` ${info.sha}` : ' (no commit)') +
    (info.pr ? ` #${info.pr}` : '') +
    (info.dirty ? ' dirty' : ''),
);
